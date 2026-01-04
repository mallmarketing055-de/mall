const express = require('express');
const router = express.Router();
const courseController = require('../controller/courseController');
const authMiddleware = require('../middelwares/authorization');

// ==========================================
// Public / User Routes
// ==========================================

// @route   GET /api/courses
// @desc    Get all available courses (with subscription status for logged in user)
// @access  Private (User) - because we need user ID for subscription status
router.get('/', authMiddleware.auth, courseController.getCourses);

// @route   POST /api/courses/:id/subscribe
// @desc    Subscribe to a course
// @access  Private (User)
router.post('/:id/subscribe', authMiddleware.auth, courseController.subscribeToCourse);

// ==========================================
// Admin Routes
// ==========================================

// @route   GET /api/courses/admin/stats
// @desc    Get course points statistics
// @access  Admin
router.get('/admin/stats',
    authMiddleware.auth,
    authMiddleware.isAdmin,
    courseController.getCourseStats
);

// @route   GET /api/courses/admin/all
// @desc    Get all courses (including expired)
// @access  Admin
router.get('/admin/all',
    authMiddleware.auth,
    authMiddleware.isAdmin,
    courseController.getAllCoursesAdmin
);

// @route   POST /api/courses
// @desc    Create a new course
// @access  Admin
router.post('/',
    authMiddleware.auth,
    authMiddleware.isAdmin,
    courseController.createCourse
);

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Admin
router.put('/:id',
    authMiddleware.auth,
    authMiddleware.isAdmin,
    courseController.updateCourse
);

module.exports = router;
