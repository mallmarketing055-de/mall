const express = require('express');
const router = express.Router();
const { generateQRCode, confirmPayment } = require('../controller/qrContoller');

router.post('/generate', generateQRCode);

router.post('/confirm', confirmPayment);

module.exports = router;