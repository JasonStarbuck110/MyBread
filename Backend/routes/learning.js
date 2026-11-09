const express = require("express");
const mongoose = require("mongoose");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { LESSON_CATALOG, gradeLesson } = require("../learning/lessonCatalog");
const QuizAttempt = require("../models/QuizAttempt");
const LessonCompletion = require("../models/LessonCompletion");
const ExpTransaction = require("../models/ExpTransaction");
const StudentProgress = require("../models/StudentProgress");
const MiniLessonCompletion = require("../models/MiniLessonCompletion");
const router = express.Router();
const asyncRoute = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

router.get(
    "/progress",
    authenticateToken,
    requireRole("student"),
    asyncRoute(async (req, res) => {
        const studentId = req.user.id;

        const [progress, completions, miniCompletions] = await Promise.all([
            StudentProgress.findOne({ studentId }).lean(),

            LessonCompletion.find({ studentId })
                .select("lessonId expAwarded completedAt")
                .lean(),

            MiniLessonCompletion.find({ studentId })
                .select("lessonId sectionIndex completedAt")
                .lean()
        ]);

        return res.json({
            totalExp: progress?.totalExp ?? 0,
            level: progress?.level ?? 1,

            completedLessons: completions.map(completion => ({
                lessonId: completion.lessonId,
                expAwarded: completion.expAwarded,
                completedAt: completion.completedAt
            })),

            miniLessons: miniCompletions.map(completion => ({
                lessonId: completion.lessonId,
                sectionIndex: completion.sectionIndex,
                completedAt: completion.completedAt
            }))
        });
    })
);

const MINI_CHECK_ANSWERS = Object.freeze({
    1: [1, 2, 1, 0, 2],
    2: [1, 1, 1, 1, 0],
    3: [0, 1, 1, 1, 1],
    4: [0, 1, 0, 1, 2],
    5: [1, 1, 1, 1, 1]
});

router.post(
    "/lessons/:lessonId/mini-lessons/:sectionIndex/complete",
    authenticateToken,
    requireRole("student"),
    asyncRoute(async (req, res) => {
        const studentId = req.user.id;
        const numericId = Number(req.params.lessonId);
        const lessonId = String(numericId);
        const sectionIndex = Number(req.params.sectionIndex);
        const correctAnswers = MINI_CHECK_ANSWERS[numericId];
        const answerIndex = req.body?.answerIndex;
        if (!Number.isSafeInteger(numericId) || !LESSON_CATALOG[numericId] ||
            !correctAnswers || !Number.isSafeInteger(sectionIndex) ||
            sectionIndex < 0 || sectionIndex >= correctAnswers.length) {
            return res.status(400).json({ error: "Invalid mini-lesson" });
        }
        if (!Number.isSafeInteger(answerIndex) || answerIndex !== correctAnswers[sectionIndex]) {
            return res.status(400).json({ error: "Answer the knowledge check correctly first" });
        }
        if (numericId > 1) {
            const previousModulePassed = await LessonCompletion.exists({
                studentId, lessonId: String(numericId - 1)
            });
            if (!previousModulePassed) {
                return res.status(403).json({ error: "Complete the previous module first" });
            }
        }
        if (sectionIndex > 0) {
            const previousCompletion = await MiniLessonCompletion.exists({
                studentId, lessonId, sectionIndex: sectionIndex - 1
            });
            if (!previousCompletion) {
                return res.status(400).json({ error: "Complete the previous mini-lesson first" });
            }
        }
        const completion = await MiniLessonCompletion.findOneAndUpdate(
            { studentId, lessonId, sectionIndex },
            { $setOnInsert: { studentId, lessonId, sectionIndex, completedAt: new Date() } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return res.json({
            completed: true,
            lessonId,
            sectionIndex,
            completedAt: completion.completedAt
        });
    })
);

router.post(
    "/lessons/:lessonId/attempt",
    authenticateToken,
    requireRole("student"),
    asyncRoute(async (req, res) => {
        const { lessonId } = req.params;
        const { answers } = req.body ?? {};
        const result = gradeLesson(lessonId, answers);
        const studentId = req.user.id;
        const cleanLessonId = String(Number(lessonId));
        const session = await mongoose.startSession();
        var responseData;
        try {
            await session.withTransaction(async () => {
                const existingCompletion = await LessonCompletion.findOne({
                    studentId,
                    lessonId: cleanLessonId
                }).session(session);
                const firstCompletion = !existingCompletion;
                const awardedExp =
                    firstCompletion && result.passed ? result.xp : 0;
                const previousAttempts = await QuizAttempt.countDocuments({
                    studentId,
                    quizId: cleanLessonId
                }).session(session);
                const now = new Date();

                await QuizAttempt.create(
                    [{
                        studentId,
                        quizId: cleanLessonId,
                        score: result.correct,
                        maxScore: result.total,
                        passed: result.passed,
                        expAwarded: awardedExp,
                        attemptNumber: previousAttempts + 1,
                        attemptedAt: now
                    }],
                    { session }
                );

                if (awardedExp > 0) {
                    await LessonCompletion.create(
                        [{
                            studentId,
                            lessonId: cleanLessonId,
                            completedAt: now,
                            expAwarded: awardedExp
                        }],
                        { session }
                    );

                    await ExpTransaction.create(
                        [{
                            studentId,
                            amount: awardedExp,
                            reason: `Passed lesson ${cleanLessonId}`,
                            sourceType: "quiz",
                            sourceId: cleanLessonId
                        }],
                        { session }
                    );

                    await StudentProgress.findOneAndUpdate(
                        { studentId },
                        {
                            $inc: { totalExp: awardedExp },
                            $set: { lastActivityAt: now },
                            $setOnInsert: { studentId }
                        },
                        {
                            upsert: true,
                            new: true,
                            setDefaultsOnInsert: true,
                            session
                        }
                    );
                }

                const progress = await StudentProgress.findOne({
                    studentId
                }).session(session);

                responseData = {
                    ...result,
                    xpAwarded: awardedExp,
                    alreadyCompleted: !firstCompletion,
                    progress: {
                        totalExp: progress?.totalExp ?? 0,
                        level: progress?.level ?? 1
                    }
                };
            });

            return res.json({
                message: "Quiz attempt recorded",
                ...responseData
            });
        } finally {
            await session.endSession();
        }
    })
);

module.exports = router;