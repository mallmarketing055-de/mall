const QRCode = require('qrcode');

exports.generateQRCode = async (req, res) => {
  try {
    const { amount, username } = req.body;

    if (!amount || !username) {
      return res.status(400).json({
        success: false,
        message: 'Amount and username are required',
      });
    }

    const qrData = JSON.stringify({ amount, username });
    const qrCodeImage = await QRCode.toDataURL(qrData);

    res.json({
      success: true,
      qrCode: qrCodeImage,
    });
  } catch (error) {
    console.error('QR Code generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating QR Code',
    });
  }
};
