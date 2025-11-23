const QRCode = require('qrcode');
const Transaction = require('../model/Transaction');
const User = require('../model/Customers'); // Assuming this is your user model
const Customers = require('../model/Customers');

// ===========================
// Generate QR Code & Save Transaction
// ===========================
// exports.generateQRCode = async (req, res) => {
//   try {
//     const { amount, username } = req.body;

//     console.log(req.user)
//     // ✅ Validate input
//     if (!amount || !username) {
//       return res.status(400).json({
//         success: false,
//         message: 'Amount and username are required'
//       });
//     }

//     // ✅ Check if there's already a pending transaction for this user and amount
//     const existingTransaction = await Transaction.findOne({
//       customerId: req.user.Customer_id,
//       amount,
//       status: 'pending'
//     });

//     if (existingTransaction) {
//       return res.status(200).json({
//         success: true,
//         message: 'Pending transaction already exists',
//         transactionId: existingTransaction._id,
//         qrCode: await QRCode.toDataURL(
//           JSON.stringify({
//             transactionId: existingTransaction._id.toString(),
//             amount: existingTransaction.amount,
//             senderUsername: existingTransaction.userName
//           })
//         )
//       });
//     }

//     const user = await Customers.findOne({_id: req.user.Customer_id});

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: 'user not found'
//       });
//     }

//     // ✅ Create a new transaction
//     const newTransaction = new Transaction({
//       customerId: req.user.Customer_id,
//       userName: req.user.username,
//       userEmail: user.email,
//       amount,
//       type: 'payment',
//       status: 'pending',
//       description: `QR Payment from ${req.user.username}`,
//       paymentMethod: 'wallet'
//     });

//     await newTransaction.save();

//     // ✅ Prepare QR data (no encoding in body)
//     const qrData = {
//       transactionId: newTransaction._id.toString(),
//       amount: newTransaction.amount,
//       senderUsername: req.user.username
//     };

//     // ✅ Generate QR code image
//     const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData));

//     return res.status(201).json({
//       success: true,
//       message: 'QR code generated successfully',
//       transactionId: newTransaction._id,
//       qrCode: qrCodeImage,
//       qrData
//     });
//   } catch (error) {
//     console.error('QR Code generation error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error generating QR Code',
//       error: error.message
//     });
//   }
// };

exports.generateQRCode = async (req, res) => {
  try {
    const { amount, username } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required"
      });
    }

    const sender = await Customers.findById(req.user.Customer_id);
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender not found"
      });
    }

    // ================================================
    // 🚀 CASE 1 — Direct Payment (username is provided)
    // ================================================
    if (username) {
      const receiver = await Customers.findOne({ username });
      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: "Receiver not found"
        });
      }

      if (sender.points < amount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient balance"
        });
      }

      // 1️⃣ Create transaction with "pending"
      const transaction = new Transaction({
        customerId: sender._id,
        userName: sender.username,
        userEmail: sender.email,
        receiverUsername: username,
        amount,
        type: "payment",
        status: "pending",
        description: `Direct payment from ${sender.username} to ${username}`,
        paymentMethod: "wallet"
      });

      await transaction.save();

      // 2️⃣ Confirm transaction directly (same logic as confirmPayment)
      sender.points -= amount;
      receiver.points += amount;

      await sender.save();
      await receiver.save();

      transaction.status = "completed";
      transaction.processedAt = new Date();
      transaction.metadata = {
        ...(transaction.metadata || {}),
        confirmedBy: username
      };

      await transaction.save();

      // 3️⃣ Return Final Response
      return res.status(200).json({
        success: true,
        message: "Payment completed successfully (no QR needed)",
        transactionId: transaction._id,
        sender: sender.username,
        receiver: receiver.username,
        amount,
        newSenderBalance: sender.points,
        newReceiverBalance: receiver.points
      });
    }

    // ================================================
    // 🚀 CASE 2 — Normal QR Code Generation
    // ================================================
    const newTransaction = new Transaction({
      customerId: sender._id,
      userName: sender.username,
      userEmail: sender.email,
      amount,
      type: "payment",
      status: "pending",
      description: `QR Payment from ${sender.username}`,
      paymentMethod: "wallet"
    });

    await newTransaction.save();

    const qrData = {
      transactionId: newTransaction._id.toString(),
      amount: newTransaction.amount,
      senderUsername: sender.username
    };

    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrData));

    return res.status(201).json({
      success: true,
      message: "QR code generated successfully",
      transactionId: newTransaction._id,
      qrCode: qrCodeImage,
      qrData
    });

  } catch (error) {
    console.error("QR/PAYMENT Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};


// ===========================
// Confirm Payment & Update Transaction
// ===========================
exports.confirmPayment = async (req, res) => {
  try {
    const { receiverUsername, amount, transactionId } = req.body;

    // ✅ Validate input
    if (!receiverUsername || !amount || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: receiverUsername, amount, or transactionId'
      });
    }

    // ✅ Find the transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // ✅ Prevent double confirmation
    if (transaction.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Transaction already completed' });
    }

    // ✅ Fetch sender and receiver
    const sender = await User.findOne({ username: transaction.userName });
    const receiver = await User.findOne({ username: receiverUsername });

    if (!sender || !receiver) {
      return res.status(404).json({ success: false, message: 'Sender or receiver not found' });
    }

    console.log(`Sender: ${sender.username}, Balance: ${sender.points}`);
    console.log(`Receiver: ${receiver.username}, Balance: ${receiver.points}`);
    // ✅ Check sender balance
    if (sender.points < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient points' });
    }

    // ✅ Perform debit & credit
    sender.points -= amount;
    receiver.points += amount;

    await sender.save();
    await receiver.save();

    // ✅ Update transaction
    transaction.status = 'completed';
    transaction.processedAt = new Date();
    transaction.metadata = {
      ...(transaction.metadata || {}),
      confirmedBy: receiverUsername
    };
    await transaction.save();

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      transactionId: transaction._id,
      sender: sender.username,
      receiver: receiver.username,
      amount,
      newSenderBalance: sender.points,
      newReceiverBalance: receiver.points
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ===========================
// Confirm Payment & Update Transaction
// ===========================
exports.confirmPayment = async (req, res) => {
  try {
    const { receiverUsername, amount, transactionId } = req.body;

    // ✅ Validate input
    if (!receiverUsername || !amount || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: receiverUsername, amount, or transactionId'
      });
    }

    // ✅ Find the transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // ✅ Prevent double confirmation
    if (transaction.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Transaction already completed' });
    }

    // ✅ Fetch sender and receiver
    const sender = await User.findOne({ username: transaction.userName });
    const receiver = await User.findOne({ username: receiverUsername });

    if (!sender || !receiver) {
      return res.status(404).json({ success: false, message: 'Sender or receiver not found' });
    }

    console.log(`Sender: ${sender.username}, Balance: ${sender.points}`);
    console.log(`Receiver: ${receiver.username}, Balance: ${receiver.points}`);

    // ✅ Check sender balance
    if (sender.points < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient points' });
    }

    // ✅ Perform debit & credit
    sender.points -= amount;
    receiver.points += amount;

    await sender.save();
    await receiver.save();

    // ✅ Update transaction
    transaction.status = 'completed';
    transaction.processedAt = new Date();
    transaction.metadata = {
      ...(transaction.metadata || {}),
      confirmedBy: receiverUsername
    };
    await transaction.save();

    return res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      transactionId: transaction._id,
      sender: sender.username,
      receiver: receiver.username,
      amount,
      newSenderBalance: sender.points,
      newReceiverBalance: receiver.points
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
