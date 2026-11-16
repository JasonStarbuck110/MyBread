'use strict'

const express = require('express')
const mongoose = require('mongoose')
const Class = require('../models/Class')
const Enrollment = require('../models/Enrollment')
const StudentProgress = require('../models/StudentProgress')
const LessonCompletion = require('../models/LessonCompletion')
const MiniLessonCompletion = require('../models/MiniLessonCompletion')
const QuizAttempt = require('../models/QuizAttempt')
const TradingPortfolio = require('../models/TradingPortfolio')
const { getMarketPrices } = require('../trading/marketData')
const { getPortfolioSummary } = require('../trading/analytics')
const { SHARE_SCALE } = require('../trading/trading')
const { authenticateToken, requireRole } = require('../middleware/auth')
const router = express.Router()

router.use(authenticateToken, requireRole('teacher'))

function levelFromXp(xp) {
    return [0, 100, 250, 500, 800, 1200].filter(n => xp >= n).length || 1
}

function groupByStudent(records) {
    const grouped = new Map()
    for (const record of records) {
        const id = String(record.studentId)
        if (!grouped.has(id)) {
            grouped.set(id, [])
        }
        grouped.get(id).push(record)
    }

    return grouped
}

function holdingsObject(portfolio) {
    if (portfolio.holdings instanceof Map) {
        return Object.fromEntries(portfolio.holdings)
    }

    return portfolio.holdings || {}
}

router.get('/class/:classId', async (req, res, next) => {
    try {
        if (!mongoose.isValidObjectId(req.params.classId)) {
            return res.status(400).json({
                error: 'Invalid class ID'
            })
        }

    const classroom = await Class.findOne({
        _id: req.params.classId,
        teacherId: req.user.id,
        status: 'active'
    }).lean()

    if (!classroom) {
        return res.status(404).json({
        error: 'Class not found'
        })
    }

    const enrollments = await Enrollment.find({
        classId: classroom._id,
        status: 'active'
    })
    .populate({
        path: 'studentId',
        match: {
            role: 'student',
            isActive: true
        },
        select: 'name email'
    }).lean()

    const people = enrollments.filter(e => e.studentId).map(e => e.studentId)
    const ids = people.map(p => p._id)
    const responseClass = {
        id: String(classroom._id),
        name: classroom.name
    }
    if (ids.length === 0) {
        return res.json({
        class: responseClass,
        students: [],
        marketDataError: null
        })
    }

    const [
        progress,
        completions,
        minis,
        attempts,
        portfolios
    ] = await Promise.all([
        StudentProgress.find({
            studentId: { $in: ids }
        }).lean(),

        LessonCompletion.find({
            studentId: { $in: ids }
        }).lean(),

        MiniLessonCompletion.find({
            studentId: { $in: ids }
        }).lean(),

        QuizAttempt.find({
            studentId: { $in: ids }
        }).lean(),

        TradingPortfolio.find({
            studentId: { $in: ids.map(String) }
        }).lean()
    ])

    const progressById = new Map(progress.map(p => [String(p.studentId), p]))
    const completionsById = groupByStudent(completions)
    const minisById = groupByStudent(minis)
    const attemptsById = groupByStudent(attempts)
    const portfoliosById = new Map(portfolios.map(p => [p.studentId, p]))
    const symbols = [
        ...new Set(
        portfolios.flatMap(p =>
            Object.entries(holdingsObject(p))
                .filter(([, units]) => units > 0)
                .map(([symbol]) => symbol)
            )
        )
    ]

    var prices = {}
    var marketDataError = null
    try {
        prices = await getMarketPrices(symbols)
    } catch {
        marketDataError = 'Live market prices are unavailable.'
    }

    const students = people.map(person => {
    const id = String(person._id)
    const xp = progressById.get(id)?.totalExp ?? 0
    const completedModules = (completionsById.get(id) || []).map(c => Number(c.lessonId))
    const miniLessons = (minisById.get(id) || [])
    .map(m => ({
        moduleId: Number(m.lessonId),
        sectionIndex: m.sectionIndex
    }))
    const bestScores = {}
    for (const attempt of attemptsById.get(id) || []) {
        const percentage = Math.round(
          attempt.score / attempt.maxScore * 100
        )

        bestScores[attempt.quizId] = Math.max(
            bestScores[attempt.quizId] ?? 0,
            percentage
        )
    }

    const scores = Object.values(bestScores)
    const quizAverage = scores.length ? Math.round(
        scores.reduce((sum, score) => sum + score, 0) /
        scores.length
    ): null
    const savedPortfolio = portfoliosById.get(id)
    var portfolio = null

    if (savedPortfolio) {
        const holdings = holdingsObject(savedPortfolio)
        var summary = null

        if (!marketDataError) {
            try {
            summary = getPortfolioSummary({
                cashCents: savedPortfolio.cashCents,
                holdings,
                transactions: savedPortfolio.transactions
            }, prices)
            } catch {}
        }

        portfolio = {
            cashCents: savedPortfolio.cashCents,
            totalCents: summary?.totalValueCents ?? null,
            gainCents: summary?.totalGainCents ?? null,
            holdings: Object.entries(holdings)
            .filter(([, units]) => units > 0)
            .map(([symbol, units]) => ({
                symbol,
                shares: units / SHARE_SCALE,
                valueCents: prices[symbol]
                ? Math.round(
                    units * prices[symbol] / SHARE_SCALE
                    )
                : null
            })),

        transactions: (
            savedPortfolio.transactions || []
            ).slice(-20).reverse().map(t => ({
            type: t.type,
            symbol: t.symbol,
            shares: t.sharesUnits / SHARE_SCALE,
            amountCents: t.amountCents,
            timestamp: t.timestamp
            }))
        }
    }

    return {
        id,
        name: person.name,
        email: person.email,
        xp,
        level: levelFromXp(xp),
        completedModules,
        miniLessons,
        bestScores,
        quizAverage,
        portfolio
        }
    })

    return res.json({
        class: responseClass,
        students,
        marketDataError
    })
    } catch (error) {
        next(error)
    }
})

module.exports = router