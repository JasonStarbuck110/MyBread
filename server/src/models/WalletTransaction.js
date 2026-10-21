
const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ["earned", "spent"],
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    relatedLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null
    }
  },
  { timestamps: true }
);

walletTransactionSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);