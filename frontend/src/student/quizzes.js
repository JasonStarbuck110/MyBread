// Quiz content from Brendan's lesson page, keyed by lesson id.
// Later this comes from the backend. Note: in a real app the correct answers
// should stay on the server and be checked there, not shipped to the browser.
export const QUIZ_MONEY_PER_CORRECT = 20 // simulated cash earned per correct answer

export const QUIZZES = {
  3: {
    title: 'Diversification essentials',
    questions: [
      {
        eyebrow: 'Risk & reward',
        question: 'Which investment typically offers the best balance of diversification and low fees?',
        helper: 'Choose the best answer.',
        answers: [
          'A single company stock',
          'A broad-market index fund',
          'A high-interest savings account',
          'A collectible with rising demand',
        ],
        correct: 1,
      },
      {
        eyebrow: 'Building a portfolio',
        question: 'Why do investors diversify their portfolios?',
        helper: 'Choose the most accurate answer.',
        answers: [
          'To guarantee a profit every year',
          'To avoid paying investment fees',
          'To spread risk across different assets',
          'To make every investment grow equally',
        ],
        correct: 2,
      },
      {
        eyebrow: 'Long-term thinking',
        question: 'What is compound growth?',
        helper: 'Choose the best answer.',
        answers: [
          'Earning returns on your returns over time',
          'Buying several investments at once',
          'Selling an asset after one year',
          'Adding up monthly account fees',
        ],
        correct: 0,
      },
    ],
  },
}
