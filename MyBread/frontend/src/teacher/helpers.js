import { today, STARTING_CASH, lessons, stockPrices, students } from './data'
import { getLevelInfo } from '../shared/mockData'

export function formatMoney(amount) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatChange(amount) {
  if (amount >= 0) {
    return "+" + formatMoney(amount);
  }
  return "-" + formatMoney(Math.abs(amount));
}

export function formatDate(dateString) {
  const date = new Date(dateString + "T12:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function daysAgoText(days) {
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return days + " days ago";
}

export function getInitials(name) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("");
}

export function percent(part, whole) {
  return Math.round((part / whole) * 100);
}

export function isPastDue(lesson) {
  return new Date(lesson.due + "T23:59") < today;
}

// Returns "done", "in progress", "not started", or "late"
export function getStatus(student, lessonIndex) {
  const value = student.progress[lessonIndex];
  if (typeof value === "number") {
    return "done";
  }
  if (isPastDue(lessons[lessonIndex])) {
    return "late";
  }
  return value;
}

export function countLessonsDone(student) {
  let count = 0;
  for (let i = 0; i < lessons.length; i++) {
    if (getStatus(student, i) === "done") {
      count++;
    }
  }
  return count;
}

export function countLateLessons(student) {
  let count = 0;
  for (let i = 0; i < lessons.length; i++) {
    if (getStatus(student, i) === "late") {
      count++;
    }
  }
  return count;
}

export function getQuizAverage(student) {
  let total = 0;
  let count = 0;
  for (const value of student.progress) {
    if (typeof value === "number") {
      total += value;
      count++;
    }
  }
  if (count === 0) return null;
  return Math.round(total / count);
}

export function getLevel(student) {
  return getLevelInfo(student.xp).level;
}

export function getHoldingValue(holding) {
  return holding.shares * stockPrices[holding.ticker].price;
}

export function getPortfolioValue(student) {
  let total = student.cash;
  for (const holding of student.holdings) {
    total += getHoldingValue(holding);
  }
  return total;
}

export function getProfit(student) {
  return getPortfolioValue(student) - STARTING_CASH;
}

// Reasons the teacher might want to check in with a student
export function getWarnings(student) {
  const warnings = [];

  const late = countLateLessons(student);
  if (late === 1) warnings.push("1 late lesson");
  if (late > 1) warnings.push(late + " late lessons");

  const quizAvg = getQuizAverage(student);
  if (quizAvg !== null && quizAvg < 70) warnings.push("Quiz avg " + quizAvg + "%");

  return warnings;
}

// How the whole class is doing on one lesson
export function getLessonSummary(lessonIndex) {
  let done = 0;
  let inProgress = 0;
  let late = 0;
  let scoreTotal = 0;

  for (const student of students) {
    const status = getStatus(student, lessonIndex);
    if (status === "done") {
      done++;
      scoreTotal += student.progress[lessonIndex];
    } else if (status === "in progress") {
      inProgress++;
    } else if (status === "late") {
      late++;
    }
  }

  let average = null;
  if (done > 0) {
    average = Math.round(scoreTotal / done);
  }

  return { done: done, inProgress: inProgress, late: late, average: average };
}

// The first lesson that isn't past due yet
export function getCurrentLesson() {
  for (let i = 0; i < lessons.length; i++) {
    if (!isPastDue(lessons[i])) {
      return i;
    }
  }
  return lessons.length - 1;
}

// Every stock purchase in the class, newest first
export function getAllTrades() {
  const trades = [];
  for (const student of students) {
    for (const holding of student.holdings) {
      trades.push({ student: student, holding: holding });
    }
  }
  trades.sort((a, b) => a.holding.daysAgo - b.holding.daysAgo);
  return trades;
}
