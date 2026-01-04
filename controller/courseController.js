const mongoose = require('mongoose');
const Course = require('../model/Course');
const UserCourse = require('../model/UserCourse');
const Transaction = require('../model/Transaction');
const Customer = require('../model/Customers'); // Note plural filename

// @desc    Create a new course
// @route   POST /api/courses
// @access  Admin
exports.createCourse = async (req, res) => {
    try {
        const { name, description, pointsCost, status } = req.body;

        const course = await Course.create({
            name,
            description,
            pointsCost,
            status
        });

        res.status(201).json({
            success: true,
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating course',
            error: error.message
        });
    }
};

// @desc    Update course details
// @route   PUT /api/courses/:id
// @access  Admin
exports.updateCourse = async (req, res) => {
    try {
        const { name, description, pointsCost, status } = req.body;

        const course = await Course.findByIdAndUpdate(
            req.params.id,
            { name, description, pointsCost, status },
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating course',
            error: error.message
        });
    }
};

// @desc    Get all courses (Public/User view)
// @route   GET /api/courses
// @access  Private (User)
exports.getCourses = async (req, res) => {
    try {
        // Mobile app/User retrieves only available courses
        // Admin might want all, but per spec "Mobile app retrieves... Only available courses"
        // We'll stick to 'available' filtering for the general endpoint.
        // If admin needs all, we can add a specific admin endpoint or query param.

        const query = { status: 'available' };

        const courses = await Course.find(query).lean();

        // Spec: "Subscription status (subscribed / not subscribed)"
        // We need to check if the current user is subscribed to any of these.

        const userId = req.user.Customer_id;
        const userSubscriptions = await UserCourse.find({ user: userId })
            .select('course')
            .lean();

        const subscribedCourseIds = new Set(userSubscriptions.map(sub => sub.course.toString()));

        const coursesWithStatus = courses.map(course => ({
            ...course,
            isSubscribed: subscribedCourseIds.has(course._id.toString())
        }));

        res.status(200).json({
            success: true,
            data: coursesWithStatus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching courses',
            error: error.message
        });
    }
};

// @desc    Get all courses (Admin view)
// @route   GET /api/courses/admin/all
// @access  Admin
exports.getAllCoursesAdmin = async (req, res) => {
    try {
        const courses = await Course.aggregate([
            {
                $lookup: {
                    from: 'usercourses',
                    localField: '_id',
                    foreignField: 'course',
                    as: 'subscriptions'
                }
            },
            {
                $addFields: {
                    totalSubscriptions: { $size: '$subscriptions' }
                }
            },
            {
                $project: {
                    subscriptions: 0
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching courses',
            error: error.message
        });
    }
};

// @desc    Subscribe to a course
// @route   POST /api/courses/:id/subscribe
// @access  Private (User)
exports.subscribeToCourse = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const courseId = req.params.id;
        const userId = req.user.Customer_id;

        // 1. Fetch Course
        const course = await Course.findById(courseId).session(session);
        if (!course) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        if (course.status !== 'available') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Course is not available for subscription' });
        }

        // 2. Check Existing Subscription
        const existingSubscription = await UserCourse.findOne({ user: userId, course: courseId }).session(session);
        if (existingSubscription) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Already subscribed to this course' });
        }
        console.log(userId);
        console.log(await Customer.findOne(
            { _id: userId },
        ));

        // 3. Check User Balance & Deduct Points
        // We look for the user with strictly enough points.
        const updatedCustomer = await Customer.findOneAndUpdate(
            { _id: userId, points: { $gte: course.pointsCost } },
            { $inc: { points: -course.pointsCost } },
            { new: true, session }
        );

        console.log(updatedCustomer);
        if (!updatedCustomer) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Insufficient points' });
        }

        // 4. Create Transaction Record
        // Transaction requires: customerId, userName, userEmail, amount, status, type
        const transaction = new Transaction({
            customerId: userId,
            userName: updatedCustomer.name || updatedCustomer.username, // Fallback if name is missing
            userEmail: updatedCustomer.email,
            amount: course.pointsCost,
            currency: 'USD', // Placeholder, strictly points but schema requires currency enum logic? 
            // Schema defaults to USD. For points, 'amount' is points. 
            // We should stick to schema valid values. 
            status: 'completed', // Immediate completion
            type: 'COURSE_SUBSCRIPTION',
            description: `Subscription to course: ${course.name}`,
            metadata: {
                courseId: course._id.toString(),
                courseName: course.name
            }
        });

        await transaction.save({ session });

        // 5. Create Subscription Record
        const subscription = new UserCourse({
            user: userId,
            course: courseId,
            pointsPaid: course.pointsCost
        });

        await subscription.save({ session });

        // 6. Commit
        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: 'Successfully subscribed to course',
            data: {
                subscription,
                remainingPoints: updatedCustomer.points
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Subscription failed',
            error: error.message
        });
    }
};
// @desc    Get course subscription statistics (Total & Monthly Points)
// @route   GET /api/courses/admin/stats
// @access  Admin
exports.getCourseStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Aggregate stats from Transactions
        const stats = await Transaction.aggregate([
            {
                $match: {
                    type: 'COURSE_SUBSCRIPTION',
                    status: 'completed'
                }
            },
            {
                $facet: {
                    totalPoints: [
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ],
                    monthlyPoints: [
                        { $match: { createdAt: { $gte: startOfMonth } } },
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ]
                }
            }
        ]);

        const totalPoints = stats[0].totalPoints[0]?.total || 0;
        const monthlyPoints = stats[0].monthlyPoints[0]?.total || 0;

        res.status(200).json({
            success: true,
            data: {
                totalPoints,
                monthlyPoints
            }
        });
    } catch (error) {
        console.error('Error fetching course stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching course stats',
            error: error.message
        });
    }
};
