const { Router } = require('express');
const { creditReward } = require('./portfolio');
const { updatePortfolio } = require('./portfolioStore');
const router = Router();
const MODULES = {
  "1": {
    "answers": [
      0,
      1,
      2,
      2,
      1
    ],
    "passingCorrect": 4,
    "cashCents": 500
  },
  "2": {
    "answers": [
      1,
      2,
      0,
      2,
      1
    ],
    "passingCorrect": 4,
    "cashCents": 500
  },
  "3": {
    "answers": [
      1,
      0,
      1,
      1,
      1
    ],
    "passingCorrect": 4,
    "cashCents": 500
  },
  "4": {
    "answers": [
      0,
      1,
      2,
      2,
      1
    ],
    "passingCorrect": 4,
    "cashCents": 500
  },
  "5": {
    "answers": [
      3,
      0,
      1,
      1,
      1
    ],
    "passingCorrect": 4,
    "cashCents": 500
  }
};

router.post('/api/rewards/module', async (req, res, next) => {
  try {
    const { moduleId, answers } = req.body || {};
    const module = MODULES[String(moduleId)];
    if (!module || !Array.isArray(answers) ||
        answers.length !== module.answers.length ||
        answers.some(a => !Number.isInteger(a) || a < 0 || a > 3)) {
      return res.status(400).json({ error: 'Invalid module quiz submission' });
    }
    const correct = answers.filter((a, i) => a === module.answers[i]).length;
    if (correct < module.passingCorrect) {
      return res.status(400).json({ error: 'Module quiz not passed', correct });
    }
    const rewardId = `module-${moduleId}-quiz`;
    const { result, portfolio } = await updatePortfolio(p => {
      if (p.rewardHistory.some(r => r.id === rewardId)) return false;
      creditReward(p, rewardId, module.cashCents);
      return true;
    });
    res.json({ credited: result, cashCents: portfolio.cashCents, rewardCents: result ? module.cashCents : 0 });
  } catch (error) { next(error); }
});

module.exports = router;