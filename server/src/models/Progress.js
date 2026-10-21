
const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true
    },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started"
    },
    bestScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

progressSchema.index(
  { student: 1, lesson: 1 },
  { unique: true }
);

module.exports = mongoose.model("Progress", progressSchema);