
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  prompt: {
    type: String,
    required: true
  },
  choices: {
    type: [String],
    required: true,
    validate: v => v.length >= 2
  },
  correctAnswerIndex: {  //For the backend to grade answers
    type: Number,
    required: true,
    min: 0
  },
  explanation: {
    type: String,
    default: ""
  },
  xpReward: {
    type: Number,
    default: 10,
    min: 0
  }
});

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    topic: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      default: 1
    },
    questions: [questionSchema],
    published: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lesson", lessonSchema);