const express = require("express");
const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const Class = require("../models/Class");
const Enrollment = require("../models/Enrollment");
const AssignmentRewardClaim = require("../models/AssignmentRewardClaim");
const MiniLessonCompletion = require("../models/MiniLessonCompletion");
const LessonCompletion = require("../models/LessonCompletion");
const { LESSON_CATALOG } = require("../learning/lessonCatalog");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { syncAssignmentRewards } = require("../services/assignmentRewards");
const router = express.Router();
const asyncRoute = handler => (req, res, next) => {
	Promise.resolve(handler(req, res, next)).catch(next);
};

router.use(authenticateToken);
router.post(
	"/rewards/sync",
	requireRole("student"),
	asyncRoute(syncAssignmentRewards)
);

router.get(
	"/mine",
	requireRole("teacher"),
	asyncRoute(async (req, res) => {
		const assignments = await Assignment.find({
			teacherId: req.user.id
		}).sort({ createdAt: -1 }).lean();

		return res.json({ assignments });
	})
);

router.get(
	"/assigned",
	requireRole("student"),
	asyncRoute(async (req, res) => {
		const enrollments = await Enrollment.find({
			studentId: req.user.id,
			status: "active"
		}).select("classId").lean();
		const classIds = enrollments.map(item => item.classId);
		const activeClasses = await Class.find({
			_id: { $in: classIds },
			status: "active"
		}).select("_id").lean();
		const activeIds = activeClasses.map(item => item._id);
		const assignments = await Assignment.find({
			classId: { $in: activeIds },
			status: "published",
			moduleId: { $ne: null },
			$or: [
				{ recipientType: "class" },
				{
					recipientType: "student",
					studentId: req.user.id
				}
			]
		}).sort({ dueDate: 1, createdAt: -1 }).lean();

        const [claims, miniCompletions, lessonCompletions] = await Promise.all([
            AssignmentRewardClaim.find({
                studentId: req.user.id,
                assignmentId: { $in: assignments.map(item => item._id) }
            }).select("assignmentId").lean(),
            MiniLessonCompletion.find({
                studentId: req.user.id
            }).select("lessonId sectionIndex completedAt").lean(),
            LessonCompletion.find({
                studentId: req.user.id
            }).select("lessonId completedAt").lean()
        ]);
        const claimedIds = new Set(claims.map(item => String(item.assignmentId)));
        const miniDates = new Map(miniCompletions.map(item => [
            `${item.lessonId}:${item.sectionIndex}`,
            item.completedAt
        ]));
        const quizDates = new Map(lessonCompletions.map(item => [
            String(item.lessonId),
            item.completedAt
        ]));
        const results = assignments.map(assignment => {
            const lessonId = String(assignment.moduleId);
            var completedAt = null;

            if (assignment.kind === "mini") {
                completedAt = miniDates.get(`${lessonId}:${assignment.sectionIndex}`) ?? null;
            } else if (assignment.kind === "module" || assignment.kind === "quiz") {
                const quizDate = quizDates.get(lessonId);

                if (quizDate && [0, 1, 2, 3, 4].every(index => {
                    const miniDate = miniDates.get(`${lessonId}:${index}`);
                    return miniDate && new Date(miniDate) <= new Date(quizDate);
                })) {
                    completedAt = quizDate;
                }
            }

            const claimed = claimedIds.has(String(assignment._id));
            const previouslyCompleted = Boolean(
                completedAt && new Date(completedAt) < new Date(assignment.createdAt)
            );
            const completionStatus = claimed
                ? "rewarded"
                : previouslyCompleted
                    ? "previously_completed"
                    : completedAt
                        ? "completed"
                        : "assigned";

            return { ...assignment, completionStatus };
        });

        return res.json({ assignments: results });

	})
);

router.post(
	"/",
	requireRole("teacher"),
	asyncRoute(async (req, res) => {
		const {
			title,
			instructions,
			classId,
			moduleId,
			kind,
			sectionIndex,
			recipientType,
			studentId,
			dueDate,
			rewardXp,
			rewardCashCents
		} = req.body || {};
		const cleanTitle = typeof title === "string" ? title.trim() : "";
		const cleanInstructions = typeof instructions === "string" ? instructions.trim() : "";
		const moduleNumber = Number(moduleId);
		const validKinds = ["module", "mini", "quiz"];
		const validRecipients = ["class", "student"];

		if (!cleanTitle || cleanTitle.length > 150) {
			return res.status(400).json({ error: "Invalid assignment title" });
		}

		if (!cleanInstructions || cleanInstructions.length > 10000) {
			return res.status(400).json({ error: "Assignment instructions are required" });
		}

		if (!mongoose.isValidObjectId(classId)) {
			return res.status(400).json({ error: "Invalid class ID" });
		}

		if (!Number.isSafeInteger(moduleNumber) || !LESSON_CATALOG[moduleNumber]) {
			return res.status(400).json({ error: "Invalid curriculum module" });
		}

		if (!validKinds.includes(kind) || !validRecipients.includes(recipientType)) {
			return res.status(400).json({ error: "Invalid assignment type or recipient" });
		}

		if (
			kind === "mini" &&
			(!Number.isSafeInteger(sectionIndex) || sectionIndex < 0 || sectionIndex > 4)
		) {
			return res.status(400).json({ error: "Invalid mini-lesson" });
		}

		if (
			!Number.isSafeInteger(rewardXp) ||
			rewardXp < 0 ||
			rewardXp > 100000 ||
			!Number.isSafeInteger(rewardCashCents) ||
			rewardCashCents < 0 ||
			rewardCashCents > 10000000 ||
			(rewardXp === 0 && rewardCashCents === 0)
		) {
			return res.status(400).json({ error: "Invalid assignment rewards" });
		}

		if (
			typeof dueDate !== "string" ||
			!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
			!Number.isFinite(Date.parse(`${dueDate}T12:00:00Z`))
		) {
			return res.status(400).json({ error: "Invalid due date" });
		}

		const classroom = await Class.findOne({
			_id: classId,
			teacherId: req.user.id,
			status: "active"
		}).lean();

		if (!classroom) {
			return res.status(404).json({ error: "Class not found" });
		}

		if (recipientType === "student") {
			if (!mongoose.isValidObjectId(studentId)) {
				return res.status(400).json({ error: "Invalid student ID" });
			}

			const enrollment = await Enrollment.exists({
				classId: classroom._id,
				studentId,
				status: "active"
			});

			if (!enrollment) {
				return res.status(400).json({
					error: "Student is not enrolled in this class"
				});
			}
		}

		const assignment = await Assignment.create({
			title: cleanTitle,
			instructions: cleanInstructions,
			classId: classroom._id,
			teacherId: req.user.id,
			moduleId: moduleNumber,
			kind,
			sectionIndex: kind === "mini" ? sectionIndex : null,
			recipientType,
			studentId: recipientType === "student" ? studentId : null,
			dueDate: new Date(`${dueDate}T12:00:00Z`),
			rewardXp,
			rewardCashCents,
			status: "published"
		});

		return res.status(201).json({ assignment });
	})
);

router.patch(
	"/:assignmentId/close",
	requireRole("teacher"),
	asyncRoute(async (req, res) => {
		if (!mongoose.isValidObjectId(req.params.assignmentId)) {
			return res.status(400).json({ error: "Invalid assignment ID" });
		}

		const assignment = await Assignment.findOneAndUpdate(
			{
				_id: req.params.assignmentId,
				teacherId: req.user.id,
				status: { $in: ["draft", "published"] }
			},
			{ $set: { status: "closed" } },
			{ new: true, runValidators: true }
		);

		if (!assignment) {
			return res.status(404).json({ error: "Active assignment not found" });
		}

		return res.json({ assignment });
	})
);

module.exports = router;