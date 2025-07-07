const { validationResult } = require('express-validator');
const ContactModel = require('../model/Contact');

// Submit Contact Form
module.exports.submitContact = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, idNumber, communicationType, message, phone, priority } = req.body;

    // Create new contact message
    const contactData = {
      email,
      idNumber,
      communicationType,
      message,
      phone: phone || null,
      priority: priority || 'medium'
    };

    const newContact = new ContactModel(contactData);
    await newContact.save();

    res.status(201).json({
      success: true,
      message: 'Your message has been submitted successfully. We will get back to you soon.',
      data: {
        contactId: newContact._id,
        submittedAt: newContact.createdAt,
        status: newContact.status,
        priority: newContact.priority
      }
    });

  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
      error: error.message
    });
  }
};

// Get Contact Messages (Admin only)
module.exports.getContactMessages = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get contacts with pagination
    const contacts = await ContactModel.find(filter)
      .populate('respondedBy', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalContacts = await ContactModel.countDocuments(filter);
    const totalPages = Math.ceil(totalContacts / limit);

    res.status(200).json({
      success: true,
      message: 'Contact messages retrieved successfully',
      data: {
        contacts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalContacts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Single Contact Message (Admin only)
module.exports.getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await ContactModel.findById(id)
      .populate('respondedBy', 'name username email');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    // Mark as read
    if (!contact.isRead) {
      contact.isRead = true;
      await contact.save();
    }

    res.status(200).json({
      success: true,
      message: 'Contact message retrieved successfully',
      data: {
        contact
      }
    });

  } catch (error) {
    console.error('Get contact by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update Contact Status (Admin only)
module.exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, adminResponse } = req.body;
    const adminId = req.user.AdminId;

    const contact = await ContactModel.findById(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    // Update fields
    if (status) contact.status = status;
    if (priority) contact.priority = priority;
    if (adminResponse) {
      contact.adminResponse = adminResponse;
      contact.respondedBy = adminId;
      contact.respondedAt = new Date();
    }

    await contact.save();

    const updatedContact = await ContactModel.findById(id)
      .populate('respondedBy', 'name username email');

    res.status(200).json({
      success: true,
      message: 'Contact message updated successfully',
      data: {
        contact: updatedContact
      }
    });

  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get Contact Statistics (Admin only)
module.exports.getContactStats = async (req, res) => {
  try {
    const totalContacts = await ContactModel.countDocuments();
    const pendingContacts = await ContactModel.countDocuments({ status: 'pending' });
    const resolvedContacts = await ContactModel.countDocuments({ status: 'resolved' });
    const urgentContacts = await ContactModel.countDocuments({ priority: 'urgent' });
    const unreadContacts = await ContactModel.countDocuments({ isRead: false });

    // Get contacts by priority
    const contactsByPriority = await ContactModel.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Contact statistics retrieved successfully',
      data: {
        overview: {
          total: totalContacts,
          pending: pendingContacts,
          resolved: resolvedContacts,
          urgent: urgentContacts,
          unread: unreadContacts
        },
        byPriority: contactsByPriority
      }
    });

  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
