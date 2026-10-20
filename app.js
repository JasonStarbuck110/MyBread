// All of this data is fake for now. When the backend is ready,
// we'll load teacher, lessons, stockPrices and students from the API instead.

const today = new Date("2026-10-20");
const STARTING_CASH = 500;

const teacher = {
  name: "Ms. Rivera",
  className: "Personal Finance, Period 3"
};

const lessons = [
  { title: "What are stocks?", due: "2026-10-08", xp: 50 },
  { title: "Financial Terminology", due: "2026-10-15", xp: 50 },
  { title: "How to Research Stocks", due: "2026-10-22", xp: 75 },
  { title: "How to Plan & Build a Portfolio", due: "2026-10-29", xp: 75 },
  { title: "Building the Portfolio", due: "2026-11-05", xp: 100 }
];

const stockPrices = {
  AAPL: { name: "Apple", price: 342.70 },
  MSFT: { name: "Microsoft", price: 421.15 },
  NVDA: { name: "NVIDIA", price: 138.40 },
  GOOGL: { name: "Alphabet", price: 176.90 },
  AMZN: { name: "Amazon", price: 201.35 },
  TSLA: { name: "Tesla", price: 255.60 }
};

// progress has one entry per lesson:
//   a number = finished, and that's their quiz score
//   "in progress" or "not started" otherwise
// lastActive = days since they last logged in
const students = [
  {
    id: 1, name: "Alex Johnson", xp: 120, lastActive: 6,
    progress: ["not started", "not started", "not started", "not started", "not started"],
    cash: 500,
    holdings: []
  },
  {
    id: 2, name: "Maya Patel", xp: 340, lastActive: 0,
    progress: [90, 80, "in progress", "not started", "not started"],
    cash: 485,
    holdings: [{ ticker: "AAPL", shares: 0.0438, daysAgo: 3 }]
  },
  {
    id: 3, name: "Jordan Lee", xp: 410, lastActive: 1,
    progress: [75, 85, 85, "not started", "not started"],
    cash: 365,
    holdings: [{ ticker: "AAPL", shares: 0.39632, daysAgo: 1 }]
  },
  {
    id: 4, name: "Sofia Garcia", xp: 560, lastActive: 0,
    progress: [90, 100, 85, 100, "not started"],
    cash: 300,
    holdings: [
      { ticker: "MSFT", shares: 0.25, daysAgo: 2 },
      { ticker: "NVDA", shares: 0.7, daysAgo: 5 }
    ]
  },
  {
    id: 5, name: "Ethan Brooks", xp: 480, lastActive: 0,
    progress: [80, 95, 100, "in progress", "not started"],
    cash: 290,
    holdings: [
      { ticker: "NVDA", shares: 0.66, daysAgo: 0 },
      { ticker: "AAPL", shares: 0.075, daysAgo: 1 },
      { ticker: "AMZN", shares: 0.5, daysAgo: 4 }
    ]
  },
  {
    id: 6, name: "Ava Nguyen", xp: 300, lastActive: 2,
    progress: [80, 80, 75, "not started", "not started"],
    cash: 420,
    holdings: [{ ticker: "TSLA", shares: 0.3, daysAgo: 6 }]
  },
  {
    id: 7, name: "Zoe Kim", xp: 220, lastActive: 5,
    progress: [65, 60, "in progress", "not started", "not started"],
    cash: 480,
    holdings: [{ ticker: "MSFT", shares: 0.05, daysAgo: 5 }]
  },
  {
    id: 8, name: "Noah Williams", xp: 230, lastActive: 3,
    progress: [80, 70, "in progress", "not started", "not started"],
    cash: 400,
    holdings: [{ ticker: "GOOGL", shares: 0.55, daysAgo: 8 }]
  },
  {
    id: 9, name: "Aaliyah Brown", xp: 110, lastActive: 6,
    progress: [80, "in progress", "not started", "not started", "not started"],
    cash: 500,
    holdings: []
  },
  {
    id: 10, name: "Daniel Okafor", xp: 390, lastActive: 1,
    progress: [80, 80, 95, "not started", "not started"],
    cash: 415,
    holdings: [{ ticker: "MSFT", shares: 0.21, daysAgo: 0 }]
  },
  {
    id: 11, name: "Emma Wilson", xp: 520, lastActive: 0,
    progress: [100, 90, 100, 95, "not started"],
    cash: 337,
    holdings: [
      { ticker: "GOOGL", shares: 0.77, daysAgo: 0 },
      { ticker: "AAPL", shares: 0.06, daysAgo: 2 }
    ]
  },
  {
    id: 12, name: "Priya Shah", xp: 250, lastActive: 4,
    progress: [85, 75, "in progress", "not started", "not started"],
    cash: 450,
    holdings: [{ ticker: "AMZN", shares: 0.24, daysAgo: 9 }]
  }
];

// Sample class average portfolio for the last 30 days (for the chart)
const chartData = [
  500, 499, 501, 500, 498, 497, 499, 498, 496, 497,
  499, 500, 502, 501, 500, 503, 504, 503, 505, 504,
  506, 505, 507, 506, 508, 507, 509, 508, 510, 509
];


// ---------- Helper functions ----------

function formatMoney(amount) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatChange(amount) {
  if (amount >= 0) {
    return "+" + formatMoney(amount);
  }
  return "-" + formatMoney(Math.abs(amount));
}

function formatDate(dateString) {
  const date = new Date(dateString + "T12:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysAgoText(days) {
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return days + " days ago";
}

function getInitials(name) {
  const parts = name.split(" ");
  return parts[0][0] + parts[1][0];
}

function percent(part, whole) {
  return Math.round((part / whole) * 100);
}

function isPastDue(lesson) {
  return new Date(lesson.due + "T23:59") < today;
}

// Returns "done", "in progress", "not started", or "late"
function getStatus(student, lessonIndex) {
  const value = student.progress[lessonIndex];
  if (typeof value === "number") {
    return "done";
  }
  if (isPastDue(lessons[lessonIndex])) {
    return "late";
  }
  return value;
}

function countLessonsDone(student) {
  let count = 0;
  for (let i = 0; i < lessons.length; i++) {
    if (getStatus(student, i) === "done") {
      count++;
    }
  }
  return count;
}

function countLateLessons(student) {
  let count = 0;
  for (let i = 0; i < lessons.length; i++) {
    if (getStatus(student, i) === "late") {
      count++;
    }
  }
  return count;
}

function getQuizAverage(student) {
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

function getLevel(student) {
  return Math.floor(student.xp / 100) + 1;
}

function getHoldingValue(holding) {
  return holding.shares * stockPrices[holding.ticker].price;
}

function getPortfolioValue(student) {
  let total = student.cash;
  for (const holding of student.holdings) {
    total += getHoldingValue(holding);
  }
  return total;
}

function getProfit(student) {
  return getPortfolioValue(student) - STARTING_CASH;
}

// Reasons the teacher might want to check in with a student
function getWarnings(student) {
  const warnings = [];

  const late = countLateLessons(student);
  if (late === 1) warnings.push("1 late lesson");
  if (late > 1) warnings.push(late + " late lessons");

  const quizAvg = getQuizAverage(student);
  if (quizAvg !== null && quizAvg < 70) warnings.push("Quiz avg " + quizAvg + "%");

  if (student.lastActive >= 5) warnings.push("Inactive " + student.lastActive + " days");

  return warnings;
}

// How the whole class is doing on one lesson
function getLessonSummary(lessonIndex) {
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
function getCurrentLesson() {
  for (let i = 0; i < lessons.length; i++) {
    if (!isPastDue(lessons[i])) {
      return i;
    }
  }
  return lessons.length - 1;
}

// Every stock purchase in the class, newest first
function getAllTrades() {
  const trades = [];
  for (const student of students) {
    for (const holding of student.holdings) {
      trades.push({ student: student, holding: holding });
    }
  }
  trades.sort((a, b) => a.holding.daysAgo - b.holding.daysAgo);
  return trades;
}

function progressBar(percentFilled) {
  return `<div class="bar"><div class="bar-fill" style="width: ${percentFilled}%"></div></div>`;
}

function showMessage(text) {
  const box = document.getElementById("message");
  box.textContent = text;
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 2000);
}


// ---------- Dashboard page ----------

function showDashboard() {
  const lessonIndex = getCurrentLesson();
  const lesson = lessons[lessonIndex];
  const summary = getLessonSummary(lessonIndex);
  const notStarted = students.length - summary.done - summary.inProgress;
  const donePercent = percent(summary.done, students.length);

  // circle math for the progress ring
  const circumference = 2 * Math.PI * 62;
  const ringOffset = circumference * (1 - donePercent / 100);

  // numbers for the four cards
  let quizTotal = 0;
  let quizCount = 0;
  let portfolioTotal = 0;
  let onTrack = 0;
  const needHelp = [];

  for (const student of students) {
    const avg = getQuizAverage(student);
    if (avg !== null) {
      quizTotal += avg;
      quizCount++;
    }
    portfolioTotal += getPortfolioValue(student);
    if (countLateLessons(student) === 0) onTrack++;
    if (getWarnings(student).length > 0) needHelp.push(student);
  }

  const classQuizAvg = Math.round(quizTotal / quizCount);
  const avgPortfolio = portfolioTotal / students.length;

  let needHelpHtml = "";
  for (const student of needHelp) {
    needHelpHtml += `
      <div class="row">
        <div class="initials">${getInitials(student.name)}</div>
        <div class="row-text">
          <div class="row-title">${student.name}</div>
          <div class="row-subtitle">${getWarnings(student).join(", ")}</div>
        </div>
        <button class="btn btn-outline btn-small" onclick="openStudent(${student.id})">View</button>
      </div>`;
  }
  if (needHelp.length === 0) {
    needHelpHtml = `<div class="nothing-here">Everyone is on track!</div>`;
  }

  let tradesHtml = "";
  for (const trade of getAllTrades().slice(0, 5)) {
    tradesHtml += `
      <div class="row">
        <div class="initials">${getInitials(trade.student.name)}</div>
        <div class="row-text">
          <div class="row-title">${trade.student.name}</div>
          <div class="row-subtitle">Bought ${trade.holding.ticker}</div>
        </div>
        <span class="small gray">${daysAgoText(trade.holding.daysAgo)}</span>
      </div>`;
  }

  let lessonBarsHtml = "";
  for (let i = 0; i < lessons.length; i++) {
    const s = getLessonSummary(i);
    lessonBarsHtml += `
      <div class="lesson-bar-row">
        <div>
          <div class="row-title">${lessons[i].title}</div>
          <div class="row-subtitle">Due ${formatDate(lessons[i].due)}</div>
        </div>
        ${progressBar(percent(s.done, students.length))}
        <b style="text-align: right">${s.done}/${students.length}</b>
      </div>`;
  }

  let profitClass = "green";
  if (avgPortfolio < STARTING_CASH) profitClass = "red";

  document.getElementById("page").innerHTML = `
    <div class="page-header">
      <div>
        <h1>Welcome back, ${teacher.name}</h1>
        <p>${teacher.className}, ${students.length} students</p>
      </div>
    </div>

    <div class="banner">
      <div class="circle">
        <svg viewBox="0 0 150 150">
          <circle cx="75" cy="75" r="62" fill="none" stroke="#6a5549" stroke-width="14" />
          <circle cx="75" cy="75" r="62" fill="none" stroke="#C19A6B" stroke-width="14"
            stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${ringOffset}" />
        </svg>
        <div class="circle-text">
          <b>${donePercent}%</b>
          <span>finished</span>
        </div>
      </div>
      <div>
        <h2>${summary.done} of ${students.length} finished "${lesson.title}"</h2>
        <p>Due ${formatDate(lesson.due)}. ${summary.inProgress} in progress, ${notStarted} haven't started.</p>
        <div class="banner-buttons">
          <a href="#lessons"><button class="btn btn-tan">View lesson progress</button></a>
          <button class="btn btn-outline-light" onclick="showMessage('Reminder sent')">Send reminder</button>
        </div>
      </div>
    </div>

    <div class="four-columns" style="margin-bottom: 22px">
      <div class="card number-card">
        <div class="label">Class quiz average</div>
        <div class="number">${classQuizAvg}%</div>
        <div class="note">All finished quizzes</div>
      </div>
      <div class="card number-card">
        <div class="label">On track</div>
        <div class="number">${onTrack}/${students.length}</div>
        <div class="note">No late lessons</div>
      </div>
      <div class="card number-card">
        <div class="label">Avg portfolio</div>
        <div class="number">${formatMoney(avgPortfolio)}</div>
        <div class="note ${profitClass}">${formatChange(avgPortfolio - STARTING_CASH)} since start</div>
      </div>
      <div class="card number-card">
        <div class="label">Need a check-in</div>
        <div class="number">${needHelp.length}</div>
        <div class="note">Late, low scores, or inactive</div>
      </div>
    </div>

    <div class="two-columns">
      <div class="card">
        <h2>Need a check-in</h2>
        ${needHelpHtml}
      </div>
      <div class="card">
        <h2>Recent trades</h2>
        ${tradesHtml}
      </div>
    </div>

    <div class="card">
      <div class="card-top">
        <h2>Lesson completion</h2>
        <span class="small gray">Students finished</span>
      </div>
      ${lessonBarsHtml}
    </div>
  `;
}


// ---------- Students page ----------

function showStudents() {
  document.getElementById("page").innerHTML = `
    <div class="page-header">
      <div>
        <h1>Students</h1>
        <p>Click a student to see their lessons and portfolio.</p>
      </div>
    </div>

    <div class="card">
      <div class="filters">
        <input type="search" id="search" placeholder="Search by name" oninput="fillStudentTable()">
        <select id="filter" onchange="fillStudentTable()">
          <option value="all">All students</option>
          <option value="help">Need a check-in</option>
          <option value="good">On track</option>
        </select>
        <select id="sort" onchange="fillStudentTable()">
          <option value="name">Sort by name</option>
          <option value="lessons">Sort by lessons done</option>
          <option value="quiz">Sort by quiz average</option>
          <option value="portfolio">Sort by portfolio</option>
        </select>
      </div>
      <div id="student-table"></div>
    </div>
  `;
  fillStudentTable();
}

function fillStudentTable() {
  const searchText = document.getElementById("search").value.toLowerCase();
  const filter = document.getElementById("filter").value;
  const sortBy = document.getElementById("sort").value;

  let list = students.filter(s => s.name.toLowerCase().includes(searchText));

  if (filter === "help") {
    list = list.filter(s => getWarnings(s).length > 0);
  } else if (filter === "good") {
    list = list.filter(s => getWarnings(s).length === 0);
  }

  if (sortBy === "name") {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "lessons") {
    list.sort((a, b) => countLessonsDone(b) - countLessonsDone(a));
  } else if (sortBy === "quiz") {
    list.sort((a, b) => (getQuizAverage(b) || 0) - (getQuizAverage(a) || 0));
  } else if (sortBy === "portfolio") {
    list.sort((a, b) => getPortfolioValue(b) - getPortfolioValue(a));
  }

  if (list.length === 0) {
    document.getElementById("student-table").innerHTML = `<div class="nothing-here">No students found.</div>`;
    return;
  }

  let rows = "";
  for (const student of list) {
    const done = countLessonsDone(student);
    const quizAvg = getQuizAverage(student);
    const profit = getProfit(student);
    const warnings = getWarnings(student);

    let statusTag = `<span class="tag tag-green">On track</span>`;
    if (warnings.length > 0) {
      statusTag = `<span class="tag tag-red">${warnings[0]}</span>`;
    }

    rows += `
      <tr class="click-row" onclick="openStudent(${student.id})">
        <td><div class="name"><div class="initials">${getInitials(student.name)}</div>${student.name}</div></td>
        <td>${getLevel(student)} <span class="small gray">(${student.xp} XP)</span></td>
        <td>
          <div class="small-progress">
            ${progressBar(percent(done, lessons.length))}
            <span class="small">${done}/${lessons.length}</span>
          </div>
        </td>
        <td>${quizAvg === null ? "-" : quizAvg + "%"}</td>
        <td>
          ${formatMoney(getPortfolioValue(student))}
          <div class="small ${profit >= 0 ? "green" : "red"}">${formatChange(profit)}</div>
        </td>
        <td class="gray">${daysAgoText(student.lastActive)}</td>
        <td>${statusTag}</td>
      </tr>`;
  }

  document.getElementById("student-table").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th>Level</th>
          <th>Lessons</th>
          <th>Quiz avg</th>
          <th>Portfolio</th>
          <th>Last active</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}


// ---------- Lessons page ----------

function showLessons() {
  let lessonRows = "";
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const s = getLessonSummary(i);

    let lateText = "";
    if (s.late > 0) lateText = `, <span class="red"><b>${s.late}</b> late</span>`;

    let statusTag;
    if (isPastDue(lesson)) {
      statusTag = `<span class="tag">Closed</span>`;
    } else if (s.done > 0 || s.inProgress > 0) {
      statusTag = `<span class="tag tag-green">Open</span>`;
    } else {
      statusTag = `<span class="tag tag-tan">Upcoming</span>`;
    }

    lessonRows += `
      <div class="lesson-row">
        <div>
          <div class="row-title">${lesson.title}</div>
          <div class="row-subtitle">Due ${formatDate(lesson.due)}, ${lesson.xp} XP</div>
        </div>
        <div>
          <div class="small"><b>${s.done}</b> done, ${s.inProgress} in progress${lateText}</div>
          ${progressBar(percent(s.done, students.length))}
        </div>
        <div>
          <div class="small gray">Quiz avg</div>
          <b>${s.average === null ? "-" : s.average + "%"}</b>
        </div>
        <div>${statusTag}</div>
      </div>`;
  }

  // table with one row per student and one column per lesson
  let headerCells = "";
  for (const lesson of lessons) {
    headerCells += `<th>${lesson.title}<div class="small">${formatDate(lesson.due)}</div></th>`;
  }

  let gridRows = "";
  for (const student of students) {
    let cells = "";
    for (let i = 0; i < lessons.length; i++) {
      const status = getStatus(student, i);
      if (status === "done") {
        cells += `<td><span class="box box-done">${student.progress[i]}%</span></td>`;
      } else if (status === "in progress") {
        cells += `<td><span class="box box-progress">In progress</span></td>`;
      } else if (status === "late") {
        cells += `<td><span class="box box-late">Late</span></td>`;
      } else {
        cells += `<td><span class="box box-empty">-</span></td>`;
      }
    }
    gridRows += `
      <tr class="click-row" onclick="openStudent(${student.id})">
        <td><div class="name"><div class="initials">${getInitials(student.name)}</div>${student.name}</div></td>
        ${cells}
      </tr>`;
  }

  document.getElementById("page").innerHTML = `
    <div class="page-header">
      <div>
        <h1>Lessons</h1>
        <p>See who finished each lesson and how they did on the quiz.</p>
      </div>
      <button class="btn btn-green" onclick="showMessage('Coming soon')">Assign lesson</button>
    </div>

    <div class="card">
      <h2>Assigned lessons</h2>
      ${lessonRows}
    </div>

    <div class="card">
      <div class="card-top">
        <h2>Progress by student</h2>
        <div class="key">
          <span class="key-done">Done (quiz score)</span>
          <span class="key-progress">In progress</span>
          <span class="key-late">Late</span>
        </div>
      </div>
      <table class="grid-table">
        <thead><tr><th>Student</th>${headerCells}</tr></thead>
        <tbody>${gridRows}</tbody>
      </table>
    </div>
  `;
}


// ---------- Stocks page ----------

let chartDays = 30;

function showStocks() {
  let classTotal = 0;
  let investing = 0;
  for (const student of students) {
    classTotal += getPortfolioValue(student);
    if (student.holdings.length > 0) investing++;
  }
  const avgProfit = classTotal / students.length - STARTING_CASH;

  const trades = getAllTrades();
  const tradesThisWeek = trades.filter(t => t.holding.daysAgo < 7).length;

  // how many students own each stock
  const owners = [];
  for (const ticker in stockPrices) {
    let count = 0;
    for (const student of students) {
      if (student.holdings.some(h => h.ticker === ticker)) count++;
    }
    owners.push({ ticker: ticker, count: count });
  }
  owners.sort((a, b) => b.count - a.count);
  const mostOwners = owners[0].count;

  let ownersHtml = "";
  for (const item of owners) {
    ownersHtml += `
      <div class="stock-bar-row">
        <div><b>${item.ticker}</b> <span class="gray">${stockPrices[item.ticker].name}</span></div>
        ${progressBar(percent(item.count, mostOwners))}
        <b style="text-align: right">${item.count}</b>
      </div>`;
  }

  const ranked = [...students].sort((a, b) => getProfit(b) - getProfit(a));
  let leaderboardHtml = "";
  for (let i = 0; i < 5; i++) {
    const student = ranked[i];
    const profit = getProfit(student);
    leaderboardHtml += `
      <div class="row" style="cursor: pointer" onclick="openStudent(${student.id})">
        <div class="initials ${i < 3 ? "rank" : ""}">${i + 1}</div>
        <div class="row-text">
          <div class="row-title">${student.name}</div>
          <div class="row-subtitle">${formatMoney(getPortfolioValue(student))}</div>
        </div>
        <b class="${profit >= 0 ? "green" : "red"}">${formatChange(profit)}</b>
      </div>`;
  }

  let tradeRows = "";
  for (const trade of trades.slice(0, 8)) {
    const h = trade.holding;
    tradeRows += `
      <tr class="click-row" onclick="openStudent(${trade.student.id})">
        <td><div class="name"><div class="initials">${getInitials(trade.student.name)}</div>${trade.student.name}</div></td>
        <td><b>${h.ticker}</b> <span class="gray">${stockPrices[h.ticker].name}</span></td>
        <td>${h.shares}</td>
        <td>${formatMoney(getHoldingValue(h))}</td>
        <td class="gray">${daysAgoText(h.daysAgo)}</td>
      </tr>`;
  }

  document.getElementById("page").innerHTML = `
    <div class="page-header">
      <div>
        <h1>Stocks</h1>
        <p>How the class is doing in the stock simulator. None of this is real money.</p>
      </div>
    </div>

    <div class="four-columns" style="margin-bottom: 22px">
      <div class="card number-card">
        <div class="label">Class total</div>
        <div class="number">${formatMoney(classTotal)}</div>
        <div class="note">${students.length} portfolios</div>
      </div>
      <div class="card number-card">
        <div class="label">Avg profit / loss</div>
        <div class="number">${formatChange(avgProfit)}</div>
        <div class="note">Per student</div>
      </div>
      <div class="card number-card">
        <div class="label">Students investing</div>
        <div class="number">${investing}/${students.length}</div>
        <div class="note">Own at least one stock</div>
      </div>
      <div class="card number-card">
        <div class="label">Trades this week</div>
        <div class="number">${tradesThisWeek}</div>
        <div class="note">Stock purchases</div>
      </div>
    </div>

    <div class="card">
      <h2>Class average portfolio</h2>
      <div class="time-buttons">
        <button id="btn-7" onclick="changeChart(7)">1W</button>
        <button id="btn-30" onclick="changeChart(30)">1M</button>
      </div>
      <div id="chart"></div>
      <p class="small gray" style="margin-top: 12px">Sample data for now. This will come from saved portfolio values later.</p>
    </div>

    <div class="two-columns">
      <div class="card">
        <h2>Most owned stocks</h2>
        ${ownersHtml}
        <p class="small gray" style="margin-top: 10px">Number of students who own each stock.</p>
      </div>
      <div class="card">
        <h2>Top portfolios</h2>
        ${leaderboardHtml}
      </div>
    </div>

    <div class="card">
      <h2>Recent trades</h2>
      <table>
        <thead>
          <tr><th>Student</th><th>Stock</th><th>Shares</th><th>Value now</th><th>When</th></tr>
        </thead>
        <tbody>${tradeRows}</tbody>
      </table>
    </div>
  `;

  changeChart(chartDays);
}

function changeChart(days) {
  chartDays = days;
  document.getElementById("btn-7").classList.toggle("active", days === 7);
  document.getElementById("btn-30").classList.toggle("active", days === 30);

  const values = chartData.slice(-days);
  const width = 1000;
  const height = 280;
  const left = 50;
  const bottom = 30;

  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;

  // turn each value into an x,y point on the chart
  const points = [];
  for (let i = 0; i < values.length; i++) {
    const x = left + (i / (values.length - 1)) * (width - left);
    const y = 10 + (1 - (values[i] - min) / (max - min)) * (height - bottom - 10);
    points.push(x.toFixed(1) + "," + y.toFixed(1));
  }

  const lastX = width;
  const baseY = height - bottom;
  const areaPoints = left + "," + baseY + " " + points.join(" ") + " " + lastX + "," + baseY;

  document.getElementById("chart").innerHTML = `
    <svg viewBox="0 0 ${width} ${height}">
      <text x="0" y="20" font-size="13" fill="#6B625B">$${Math.round(max)}</text>
      <text x="0" y="${baseY}" font-size="13" fill="#6B625B">$${Math.round(min)}</text>
      <polygon points="${areaPoints}" fill="#E2EBE4" />
      <polyline points="${points.join(" ")}" fill="none" stroke="#3C6E4D" stroke-width="3.5" />
      <text x="${left}" y="${height - 6}" font-size="13" fill="#6B625B">${days} days ago</text>
      <text x="${width}" y="${height - 6}" font-size="13" fill="#6B625B" text-anchor="end">Today</text>
    </svg>
  `;
}


// ---------- Student side panel ----------

function openStudent(id) {
  const student = students.find(s => s.id === id);
  const quizAvg = getQuizAverage(student);
  const profit = getProfit(student);

  let warningTags = "";
  for (const warning of getWarnings(student)) {
    warningTags += `<span class="tag tag-red" style="margin-right: 6px">${warning}</span>`;
  }

  let lessonRows = "";
  for (let i = 0; i < lessons.length; i++) {
    const status = getStatus(student, i);
    let tag;
    if (status === "done") tag = `<span class="tag tag-green">${student.progress[i]}%</span>`;
    else if (status === "in progress") tag = `<span class="tag tag-tan">In progress</span>`;
    else if (status === "late") tag = `<span class="tag tag-red">Late</span>`;
    else tag = `<span class="tag">Not started</span>`;

    lessonRows += `
      <div class="row">
        <div class="row-text">
          <div class="row-title">${lessons[i].title}</div>
          <div class="row-subtitle">Due ${formatDate(lessons[i].due)}</div>
        </div>
        ${tag}
      </div>`;
  }

  let holdingsHtml = `<div class="nothing-here">No stocks yet.</div>`;
  if (student.holdings.length > 0) {
    let rows = "";
    for (const h of student.holdings) {
      rows += `
        <tr>
          <td><b>${h.ticker}</b> <span class="gray">${stockPrices[h.ticker].name}</span></td>
          <td>${h.shares}</td>
          <td>${formatMoney(getHoldingValue(h))}</td>
        </tr>`;
    }
    holdingsHtml = `
      <table>
        <thead><tr><th>Stock</th><th>Shares</th><th>Value</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  document.getElementById("drawer").innerHTML = `
    <div class="drawer-top">
      <div>
        <h2>${student.name}</h2>
        <p class="gray">Level ${getLevel(student)}, last active ${daysAgoText(student.lastActive).toLowerCase()}</p>
      </div>
      <button class="close-btn" onclick="closeStudent()">&times;</button>
    </div>

    <p style="margin-bottom: 16px">${warningTags}</p>

    <div class="student-numbers">
      <div><b>${student.xp}</b><span>XP</span></div>
      <div><b>${quizAvg === null ? "-" : quizAvg + "%"}</b><span>Quiz avg</span></div>
      <div><b>${countLessonsDone(student)}/${lessons.length}</b><span>Lessons</span></div>
    </div>

    <div class="card">
      <h3>Lessons</h3>
      ${lessonRows}
    </div>

    <div class="card">
      <h3>Portfolio: ${formatMoney(getPortfolioValue(student))}</h3>
      <p class="small ${profit >= 0 ? "green" : "red"}">${formatChange(profit)} since start</p>
      <p class="small gray" style="margin: 4px 0 10px">Cash: ${formatMoney(student.cash)}</p>
      ${holdingsHtml}
    </div>

    <button class="btn btn-green" onclick="showMessage('Message sent')">Send message</button>
    <button class="btn btn-outline" onclick="closeStudent()">Close</button>
  `;

  document.getElementById("drawer").classList.add("open");
  document.getElementById("overlay").classList.add("open");
}

function closeStudent() {
  document.getElementById("drawer").classList.remove("open");
  document.getElementById("overlay").classList.remove("open");
}


// ---------- Switching pages ----------

function showPage() {
  let page = window.location.hash.replace("#", "");
  if (page === "") page = "dashboard";

  // highlight the right link in the sidebar
  for (const link of document.querySelectorAll(".nav a")) {
    link.classList.remove("active");
  }
  const activeLink = document.getElementById("nav-" + page);
  if (activeLink) activeLink.classList.add("active");

  if (page === "students") showStudents();
  else if (page === "lessons") showLessons();
  else if (page === "stocks") showStocks();
  else showDashboard();

  closeStudent();
  window.scrollTo(0, 0);
}

document.getElementById("teacher-name").textContent = teacher.name;
document.getElementById("class-name").textContent = teacher.className;

window.addEventListener("hashchange", showPage);
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeStudent();
});

showPage();
