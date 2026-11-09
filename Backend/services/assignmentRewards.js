const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const AssignmentRewardClaim = require("../models/AssignmentRewardClaim");
const Class = require("../models/Class");
const Enrollment = require("../models/Enrollment");
const LessonCompletion = require("../models/LessonCompletion");
const MiniLessonCompletion = require("../models/MiniLessonCompletion");
const ExpTransaction = require("../models/ExpTransaction");
const StudentProgress = require("../models/StudentProgress");
const TradingPortfolio = require("../models/TradingPortfolio");
const { createPortfolio } = require("../trading/portfolio");

async function completedAt(assignment, studentId, session) {
	const lessonId = String(assignment.moduleId);
	if (assignment.kind === "mini") {
		const record = await MiniLessonCompletion.findOne({
			studentId,
			lessonId,
			sectionIndex: assignment.sectionIndex
		}).select("completedAt").session(session).lean();
		return record?.completedAt ?? null;
	}
	if (assignment.kind !== "module" && assignment.kind !== "quiz") return null;
	const quiz = await LessonCompletion.findOne({ studentId, lessonId })
		.select("completedAt").session(session).lean();
	if (!quiz?.completedAt) return null;
	const minis = await MiniLessonCompletion.find({
		studentId,
		lessonId,
		sectionIndex: { $in: [0, 1, 2, 3, 4] }
	}).select("sectionIndex completedAt").session(session).lean();
	if (new Set(minis.map(item => item.sectionIndex)).size !== 5) return null;
	if (minis.some(item => !item.completedAt || item.completedAt > quiz.completedAt)) return null;
	return quiz.completedAt;
}

async function claimOne(studentId, assignmentId) {
	const session = await mongoose.startSession();
	try {
		return await session.withTransaction(async () => {
			const assignment = await Assignment.findOne({
				_id: assignmentId,
				status: "published"
			}).session(session).lean();
			if (!assignment) return null;
			if (assignment.recipientType === "student" && String(assignment.studentId) !== String(studentId)) return null;
			const classroom = await Class.exists({ _id: assignment.classId, status: "active" }).session(session);
			const enrollment = await Enrollment.exists({
				studentId,
				classId: assignment.classId,
				status: "active"
			}).session(session);
			if (!classroom || !enrollment) return null;
			const completionTime = await completedAt(assignment, studentId, session);
			if (!completionTime || !assignment.createdAt || completionTime < assignment.createdAt) return null;
			const existing = await AssignmentRewardClaim.exists({ assignmentId, studentId }).session(session);
			if (existing) return null;
			const now = new Date();
			const rewardId = `assignment-${assignment._id}`;
			await AssignmentRewardClaim.create([{
				assignmentId: assignment._id,
				studentId,
				sourceCompletedAt: completionTime,
				rewardXp: assignment.rewardXp,
				rewardCashCents: assignment.rewardCashCents
			}], { session });
			if (assignment.rewardXp > 0) {
				await ExpTransaction.create([{
					studentId,
					amount: assignment.rewardXp,
					reason: `Completed assignment: ${assignment.title}`.slice(0, 200),
					sourceType: "assignment",
					sourceId: String(assignment._id)
				}], { session });
				await StudentProgress.findOneAndUpdate(
					{ studentId },
					{
						$inc: { totalExp: assignment.rewardXp },
						$set: { lastActivityAt: now },
						$setOnInsert: { studentId }
					},
					{ session, upsert: true, setDefaultsOnInsert: true }
				);
			}
			if (assignment.rewardCashCents > 0) {
				const portfolio = await TradingPortfolio.findOneAndUpdate(
					{ studentId, "rewardHistory.id": { $ne: rewardId } },
					{
						$inc: { cashCents: assignment.rewardCashCents, __v: 1 },
						$push: { rewardHistory: {
							id: rewardId,
							amountCents: assignment.rewardCashCents,
							earnedAt: now.toISOString()
						} }
					},
					{ session, new: true }
				);
				if (!portfolio) throw new Error("Assignment wallet credit conflict; retry the request");
			}
			return {
				assignmentId: String(assignment._id),
				rewardXp: assignment.rewardXp,
				rewardCashCents: assignment.rewardCashCents
			};
		});
	} catch (error) {
		if (error.code === 11000 && await AssignmentRewardClaim.exists({ assignmentId, studentId })) return null;
		throw error;
	} finally {
		await session.endSession();
	}
}

async function syncAssignmentRewards(req, res) {
	const studentId = req.user.id;
	const enrollments = await Enrollment.find({ studentId, status: "active" }).select("classId").lean();
	const classrooms = await Class.find({
		_id: { $in: enrollments.map(item => item.classId) },
		status: "active"
	}).select("_id").lean();
	const assignments = await Assignment.find({
		classId: { $in: classrooms.map(item => item._id) },
		status: "published",
		moduleId: { $ne: null },
		$or: [
			{ recipientType: "class" },
			{ recipientType: "student", studentId }
		]
	}).select("_id rewardCashCents").lean();
	if (assignments.some(item => item.rewardCashCents > 0)) {
		await TradingPortfolio.findOneAndUpdate(
			{ studentId },
			{ $setOnInsert: { studentId, ...createPortfolio() } },
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);
	}
	const previousClaims = await AssignmentRewardClaim.find({
		studentId,
		assignmentId: { $in: assignments.map(item => item._id) }
	}).select("assignmentId").lean();
	const claimedIds = new Set(previousClaims.map(item => String(item.assignmentId)));
	const credited = [];
	for (const assignment of assignments) {
		if (claimedIds.has(String(assignment._id))) continue;
		const claim = await claimOne(studentId, assignment._id);
		if (claim) credited.push(claim);
	}
	const [portfolio, progress] = await Promise.all([
		TradingPortfolio.findOne({ studentId }).select("cashCents").lean(),
		StudentProgress.findOne({ studentId }).select("totalExp").lean()
	]);
	return res.json({
		awardedCount: credited.length,
		earnedCashCents: credited.reduce((sum, item) => sum + item.rewardCashCents, 0),
		earnedXp: credited.reduce((sum, item) => sum + item.rewardXp, 0),
		cashCents: portfolio?.cashCents ?? 0,
		totalExp: progress?.totalExp ?? 0,
		credited
	});
}

module.exports = { syncAssignmentRewards };