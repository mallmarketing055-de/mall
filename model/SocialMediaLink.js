const mongoose = require("mongoose");

const socialMediaLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      enum: ["facebook", "twitter", "instagram", "linkedin", "youtube", "tiktok", "other"],
    },
    url: {
      type: String,
      required: true,
    },
    icon: {
      type: String, // optional — could store icon name or URL
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SocialMediaLink", socialMediaLinkSchema);
