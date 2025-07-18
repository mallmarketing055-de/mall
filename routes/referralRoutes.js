const express = require('express');
const router = express.Router();
const referralController = require('../controller/referralController');
const { auth } = require('../middelwares/authorization');

// Get customer's referral information
router.get('/info', auth, referralController.getReferralInfo);

// Get customer's referral network (hierarchical tree structure)
router.get('/network', auth, referralController.getReferralNetwork);

// Get customer's direct referrals only (flat list with pagination)
router.get('/direct', auth, referralController.getDirectReferrals);

// Validate referral code (public endpoint for registration)
router.post('/validate', referralController.validateReferralCode);

// Get referral statistics
router.get('/stats', auth, referralController.getReferralStats);

module.exports = router;
