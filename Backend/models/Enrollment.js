const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true
        },

        status: {
            type: String,
            enum: ["active", "removed"],
            default: "active"
        },

        enrolledAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
        collection: "enrollments"
    }
);

// A student can have only one enrollment record per class.
enrollmentSchema.index(
    { studentId: 1, classId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);