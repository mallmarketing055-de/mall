const express = require('express');
const router = express.Router();
const authMiddleware = require('../middelwares/authorization');
const { generateQRCode, confirmPayment } = require('../controller/qrContoller');

router.post('/generate', authMiddleware.auth, generateQRCode);

router.post('/confirm', authMiddleware.auth, confirmPayment);

module.exports = router;