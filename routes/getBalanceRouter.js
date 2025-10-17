const express = require('express');
const router = express.Router();
const { getWalletBalance } = require('../controller/walletController');
const authMiddleware = require('../middelwares/authorization');


router.get('/balance', authMiddleware, getWalletBalance);

module.exports = router;
