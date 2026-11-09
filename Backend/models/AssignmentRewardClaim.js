const mongoose = require("mongoose");
const assignmentRewardClaimSchema = new mongoose.Schema(
	{
		assignmentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Assignment",
			required: true,
			index: true
		},
		studentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true
		},
		sourceCompletedAt: {
			type: Date,
			required: true
		},
		rewardXp: {
			type: Number,
			required: true,
			min: 0,
			max: 100000,
			validate: Number.isSafeInteger
		},
		rewardCashCents: {
			type: Number,
			required: true,
			min: 0,
			max: 10000000,
			validate: Number.isSafeInteger
		}
	},
	{
		timestamps: true,
		collection: "assignmentRewardClaims"
	}
);

assignmentRewardClaimSchema.index(
	{ assignmentId: 1, studentId: 1 },
	{ unique: true }
);

module.exports = mongoose.model(
	"AssignmentRewardClaim",
	assignmentRewardClaimSchema
);