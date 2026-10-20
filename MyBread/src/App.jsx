import { useEffect, useState } from "react";
import "./App.css";

const questions = [
  {
    eyebrow: "Risk & reward",
    question: "Which investment typically offers the best balance of diversification and low fees?",
    helper: "Choose the best answer.",
    answers: [
      "A single company stock",
      "A broad-market index fund",
      "A high-interest savings account",
      "A collectible with rising demand",
    ],
    correct: 1,
  },
  {
    eyebrow: "Building a portfolio",
    question: "Why do investors diversify their portfolios?",
    helper: "Choose the most accurate answer.",
    answers: [
      "To guarantee a profit every year",
      "To avoid paying investment fees",
      "To spread risk across different assets",
      "To make every investment grow equally",
    ],
    correct: 2,
  },
  {
    eyebrow: "Long-term thinking",
    question: "What is compound growth?",
    helper: "Choose the best answer.",
    answers: [
      "Earning returns on your returns over time",
      "Buying several investments at once",
      "Selling an asset after one year",
      "Adding up monthly account fees",
    ],
    correct: 0,
  },
];

const lessonId = "diversification-essentials";
const lessonReward = { xp: 75};
const questionReward = { money: 20}

function loadPlayerData() {
  try {
    const saved = JSON.parse(localStorage.getItem("mybread-player"));
    return {
      xp: Number.isFinite(saved?.xp) ? saved.xp : 340,
      money: Number.isFinite(saved?.money) ? saved.money : 120,
      completedLessons: Array.isArray(saved?.completedLessons) ? saved.completedLessons : [],
    };
  } catch {
    return { xp: 340, money: 120, completedLessons: [] };
  }
}

function App() {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [complete, setComplete] = useState(false);
  const [playerData, setPlayerData] = useState(loadPlayerData);

  useEffect(() => {
    localStorage.setItem("mybread-player", JSON.stringify(playerData));
  }, [playerData]);

  const question = questions[current];
  const progress = complete ? 100 : ((current + 1) / questions.length) * 100;

  const handleContinue = () => {
    if (selected === null) return;

    if (!submitted) {
      setSubmitted(true);
      if (selected === question.correct) setScore((value) => value + 1);
      return;
    }

    if (current === questions.length - 1) {
      setComplete(true);
      setPlayerData((previous) => {
        if (previous.completedLessons.includes(lessonId)) return previous;

        return {
          xp: previous.xp + lessonReward.xp,
          money: previous.money + questionReward.money * score,
          completedLessons: [...previous.completedLessons, lessonId],
        };
      });
      return;
    }

    setCurrent((value) => value + 1);
    setSelected(null);
    setSubmitted(false);
  };

  const restartQuiz = () => {
    setCurrent(0);
    setSelected(null);
    setSubmitted(false);
    setScore(0);
    setComplete(false);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">MyBread</div>
          <nav aria-label="Main navigation">
            <button className="nav-item active" type="button">
              <span>Dashboard</span>
            </button>
            <button className="nav-item" type="button">
              <span>Lessons</span>
            </button>
            <button className="nav-item" type="button">
              <span>Stocks</span>
            </button>
            <button className="nav-item" type="button">
              <span>Achievements</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="level-mark">Level 7</div>
          <div>
            <strong>{playerData.xp} XP</strong>
            <span>{playerData.money}$</span>
          </div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <button className="back-button" type="button" aria-label="Back to lessons">
            <span aria-hidden="true">←</span>
            <span>Back to lessons</span>
          </button>
        </header>

        <div className="lesson">
          <div className="lesson-meta">
            <div>
              <p className="kicker">Personal finance · Lesson 3</p>
              <p className="lesson-title">Diversification essentials</p>
            </div>
            <p className="question-count">
              {complete ? "Complete" : `Question ${current + 1} of ${questions.length}`}
            </p>
          </div>

          <div className="progress-track" aria-label={`${Math.round(progress)}% complete`}>
            <span style={{ width: `${progress}%` }} />
          </div>

          {complete ? (
            <section className="completion-card">
              <p className="kicker">Lesson complete</p>
              <h1>Good job!</h1>
              <p className="completion-copy">
                You scored {score} out of {questions.length}.
              </p>
              <div className="reward">
                <span>Lesson reward</span>
                <strong>+{lessonReward.xp} XP earned. </strong>
                <strong>+{questionReward.money * score}$ earned.</strong>
              </div>
              <button className="primary-button" type="button" onClick={restartQuiz}>
                Review questions
              </button>
            </section>
          ) : (
            <section className="question-card">
              <div className="question-heading">
                <p className="kicker">{question.eyebrow}</p>
                <h1>{question.question}</h1>
                <p className="helper">{question.helper}</p>
              </div>

              <div className="answer-list" role="radiogroup" aria-label="Answer choices">
                {question.answers.map((answer, index) => {
                  const isSelected = selected === index;
                  const isCorrect = submitted && index === question.correct;
                  const isWrong = submitted && isSelected && index !== question.correct;

                  return (
                    <button
                      className={[
                        "answer",
                        isSelected ? "selected" : "",
                        isCorrect ? "correct" : "",
                        isWrong ? "wrong" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      key={answer}
                      onClick={() => !submitted && setSelected(index)}
                    >
                      <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                      <span className="answer-text">{answer}</span>
                      <span className="answer-check" aria-hidden="true">
                        {isCorrect ? "✓" : isWrong ? "×" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className={selected === question.correct ? "feedback correct" : "feedback"}>
                  <strong>{selected === question.correct ? "Correct!" : "Not quite"}</strong>
                  <span>
                    {selected === question.correct
                      ? "Broad funds can spread risk while keeping costs low."
                      : "Look for the option that spreads risk across many investments."}
                  </span>
                </div>
              )}

              <div className="question-footer">
              
                <button
                  className="primary-button"
                  type="button"
                  disabled={selected === null}
                  onClick={handleContinue}
                >
                  {submitted
                    ? current === questions.length - 1
                      ? "See results"
                      : "Next question"
                    : "Check answer"}
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
