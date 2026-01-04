const mongoose = require('mongoose');

const userCourseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    purchasedAt: {
        type: Date,
        default: Date.now
    },
    pointsPaid: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

// Enforce unique subscription per user per course
userCourseSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('UserCourse', userCourseSchema);
