const TradingPortfolio = require("../models/TradingPortfolio");
const { getMarketPrices } = require("../trading/marketData");
const { calculatePortfolioValue } = require("../trading/analytics");

const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Class = require("../models/Class");
const Enrollment = require("../models/Enrollment");
const { authenticateToken, requireRole } = require("../middleware/auth");
const router = express.Router();
const asyncRoute = (handler) => (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);
function generateEnrollmentCode() {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
}

// CREATE CLASS — TEACHERS
router.post(
    "/",
    authenticateToken,
    requireRole("teacher"),
    asyncRoute(async (req, res) => {
        const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
        const description = typeof req.body.description === "string"
            ? req.body.description.trim()
            : "";

        if (!name || name.length > 100 || description.length > 1000) {
            return res.status(400).json({ error: "Invalid class details" });
        }

        var createdClass;

        for (var attempt = 0; attempt < 5; attempt++) {
            try {
                createdClass = await Class.create({
                    name,
                    description,
                    teacherId: req.user.id,
                    enrollmentCode: generateEnrollmentCode()
                });
                break;
            } catch (error) {
                if (error.code !== 11000 || attempt === 4) throw error;
            }
        }

        return res.status(201).json({ class: createdClass });
    })
);

// VIEW MY CLASSES — TEACHERS
router.get(
    "/mine",
    authenticateToken,
    requireRole("teacher"),
    asyncRoute(async (req, res) => {
        const classes = await Class.find({
            teacherId: req.user.id,
            status: "active"
        }).sort({ createdAt: -1 }).lean();

        return res.json({ classes });
    })
);

// JOIN CLASS — STUDENTS
router.post(
    "/join",
    authenticateToken,
    requireRole("student"),
    asyncRoute(async (req, res) => {
        const code = typeof req.body.enrollmentCode === "string"
            ? req.body.enrollmentCode.trim().toUpperCase()
            : "";

        if (!/^[A-F0-9]{8}$/.test(code)) {
            return res.status(400).json({ error: "Invalid enrollment code" });
        }

        const foundClass = await Class.findOne({
            enrollmentCode: code,
            status: "active"
        });

        if (!foundClass) {
            return res.status(404).json({ error: "Class not found" });
        }

        const enrollment = await Enrollment.findOneAndUpdate(
            {
                studentId: req.user.id,
                classId: foundClass._id
            },
            {
                $set: { status: "active" },
                $setOnInsert: {
                    studentId: req.user.id,
                    classId: foundClass._id,
                    enrolledAt: new Date()
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        return res.status(200).json({
            message: "Successfully joined class",
            enrollment,
            class: {
                id: foundClass._id,
                name: foundClass.name,
                description: foundClass.description
            }
        });
    })
);

// VIEW MY CLASSES — STUDENTS
router.get(
    "/enrolled",
    authenticateToken,
    requireRole("student"),
    asyncRoute(async (req, res) => {
        const enrollments = await Enrollment.find({
            studentId: req.user.id,
            status: "active"
        })
            .populate({
                path: "classId",
                match: { status: "active" },
                select: "name description teacherId"
            })
            .lean();

        return res.json({
            classes: enrollments
                .filter(enrollment => enrollment.classId)
                .map(enrollment => ({
                    enrollmentId: enrollment._id,
                    enrolledAt: enrollment.enrolledAt,
                    ...enrollment.classId
                }))
        });
    })
);

// VIEW STUDENTS IN A TEACHER'S CLASS
router.get(
    "/:classId/students",
    authenticateToken,
    requireRole("teacher"),
    asyncRoute(async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.classId)) {
            return res.status(400).json({ error: "Invalid class ID" });
        }

        const foundClass = await Class.findOne({
            _id: req.params.classId,
            teacherId: req.user.id
        });

        if (!foundClass) {
            return res.status(404).json({ error: "Class not found" });
        }

        const enrollments = await Enrollment.find({
            classId: foundClass._id,
            status: "active"
        })
            .populate("studentId", "name email")
            .lean();

        return res.json({
            students: enrollments
                .filter(enrollment => enrollment.studentId)
                .map(enrollment => ({
                    id: enrollment.studentId._id,
                    name: enrollment.studentId.name,
                    email: enrollment.studentId.email,
                    enrolledAt: enrollment.enrolledAt
                }))
        });
    })
);


router.get(
	"/:classId/leaderboard",
	authenticateToken,
	requireRole("student"),
	asyncRoute(async (req, res) => {
		const classId = req.params.classId;

		if (!mongoose.isValidObjectId(classId)) {
			return res.status(400).json({ error: "Invalid class ID" });
		}

		const [classroom, membership] = await Promise.all([
			Class.findOne({ _id: classId, status: "active" })
				.select("_id name")
				.lean(),
			Enrollment.exists({
				classId,
				studentId: req.user.id,
				status: "active"
			})
		]);

		if (!classroom || !membership) {
			return res.status(404).json({ error: "Class not found or student not enrolled" });
		}

		const enrollments = await Enrollment.find({
			classId,
			status: "active"
		}).populate({
			path: "studentId",
			match: { role: "student", isActive: true },
			select: "name"
		}).lean();

		const members = enrollments
			.filter(item => item.studentId)
			.map(item => item.studentId);
		const studentIds = members.map(person => String(person._id));

		const portfolios = await TradingPortfolio.find({
			studentId: { $in: studentIds }
		}).select("studentId cashCents holdings").lean();

		const holdingsOf = portfolio => portfolio.holdings instanceof Map
			? Object.fromEntries(portfolio.holdings)
			: portfolio.holdings || {};

		const symbols = [...new Set(portfolios.flatMap(portfolio =>
			Object.entries(holdingsOf(portfolio))
				.filter(([, units]) => units > 0)
				.map(([symbol]) => symbol)
		))];

		var prices;
		try {
			prices = await getMarketPrices(symbols);
		} catch {
			return res.status(503).json({
				error: "Live market prices are unavailable. Try again shortly."
			});
		}

		const portfoliosByStudent = new Map(
			portfolios.map(portfolio => [String(portfolio.studentId), portfolio])
		);

		const ranking = members.map(person => {
			const id = String(person._id);
			const portfolio = portfoliosByStudent.get(id);
			const valueCents = portfolio
				? calculatePortfolioValue({
					cashCents: portfolio.cashCents,
					holdings: holdingsOf(portfolio)
				}, prices)
				: 0;

			return {
				id,
				name: person.name,
				valueCents
			};
		}).sort((a, b) =>
			b.valueCents - a.valueCents ||
			a.name.localeCompare(b.name) ||
			a.id.localeCompare(b.id)
		);

		return res.json({
			class: {
				id: String(classroom._id),
				name: classroom.name
			},
			ranking: ranking.map((student, index) => ({
				...student,
				rank: index + 1
			}))
		});
	})
);

module.exports = router;