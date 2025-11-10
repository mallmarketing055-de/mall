const SocialMediaLink = require("../model/SocialMediaLink");

// ✅ Create new social media link
exports.createLink = async (req, res) => {
  try {
    const { platform, url, icon } = req.body;
    console.log('Request body:', req.user);
    console.log('Request body:', req.body);
    const userId = req.user.AdminId; // assuming user is authenticated

    const link = await SocialMediaLink.create({ platform, url, icon, userId });

    res.status(201).json({ success: true, data: link });
  } catch (err) {
    console.error('Error creating link:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get all links for a user
exports.getLinks = async (req, res) => {
  try {
    const links = await SocialMediaLink.find();
    res.status(200).json({ success: true, data: links });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Update a link
exports.updateLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, url, icon } = req.body;

    const link = await SocialMediaLink.findByIdAndUpdate(
      id,
      { platform, url, icon },
      { new: true }
    );

    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }

    res.status(200).json({ success: true, data: link });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Delete a link
exports.deleteLink = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await SocialMediaLink.findByIdAndDelete(id);

    if (!link) {
      return res.status(404).json({ success: false, message: "Link not found" });
    }

    res.status(200).json({ success: true, message: "Link deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get specific link by ID
exports.getLinkById = async (req, res) => {
  try {
    const { id } = req.params;
    const link = await SocialMediaLink.findById(id);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Social media link not found",
      });
    }

    res.status(200).json({
      success: true,
      data: link,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
