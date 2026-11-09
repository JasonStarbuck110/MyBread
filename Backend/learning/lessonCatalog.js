const LESSON_CATALOG = {
    1: {
        xp: 50,
        passingCorrect: 4,
        answers: [0, 1, 2, 2, 1]
    },
    2: {
        xp: 100,
        passingCorrect: 4,
        answers: [1, 2, 0, 2, 1]
    },
    3: {
        xp: 150,
        passingCorrect: 4,
        answers: [1, 0, 1, 1, 1]
    },
    4: {
        xp: 200,
        passingCorrect: 4,
        answers: [0, 1, 2, 2, 1]
    },
    5: {
        xp: 250,
        passingCorrect: 4,
        answers: [3, 0, 1, 1, 1]
    }
};

function gradeLesson(lessonId, submittedAnswers) {
    const lesson = LESSON_CATALOG[Number(lessonId)];
    if (!lesson) {
        throw new Error("Invalid lesson");
    }

    if (
        !Array.isArray(submittedAnswers) ||
        submittedAnswers.length !== lesson.answers.length ||
        submittedAnswers.some(
            answer =>
                !Number.isInteger(answer) ||
                answer < 0 ||
                answer > 3
        )
    ) {
        throw new Error("Invalid quiz answers");
    }

    const correct = submittedAnswers.reduce(
        (total, answer, index) =>
            total + (answer === lesson.answers[index] ? 1 : 0),
        0
    );

    return {
        correct,
        total: lesson.answers.length,
        percent: Math.round(
            (correct / lesson.answers.length) * 100
        ),
        passed: correct >= lesson.passingCorrect,
        xp: correct >= lesson.passingCorrect ? lesson.xp : 0
    };
}

module.exports = {
    LESSON_CATALOG,
    gradeLesson
};