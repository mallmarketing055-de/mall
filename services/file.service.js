const cloudinary = require("cloudinary");
// const ReturnResponseDTO = require("../../dtos/returnResponse.dto");

// ✅ Configure Cloudinary if not configured globally
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a list of image files to Cloudinary.
 * @param {Array} files - Array of files (req.files)
 * @returns {Promise<ReturnResponseDTO>}
 */
const uploadFilesService = async (files) => {
  try {
    if (!files) {
      const err = new Error("[files] is required");
      err.name = "PRECONDITION_FAILED";
      err.statusCode = 500;
      err.isOperational = false;
      throw err;
    }

    if (files.length === 0) {
      const err = new Error("You should only upload images in the format (jpg|jpeg|gif|png).");
      err.name = "FORBIDDEN";
      err.statusCode = 500;
      err.isOperational = false;
      throw err;
    }


    const uploadedImages = await imageUploaderHandler(files);

    return {
      status: 200,
      message: "Files uploaded successfully",
      data: uploadedImages.map((image) => ({
        cloudinaryPublicId: image.secure_url,
      })),
    };
  } catch (error) {
    const err = new Error(error.message || "Internal Server Error");
    err.name = "INTERNAL_SERVER_ERROR";
    err.statusCode = 500;
    err.isOperational = false;
    throw err;

  }
};

/**
 * Handles the upload process to Cloudinary.
 * @param {Array} files - Array of Multer file objects
 * @returns {Promise<Array>}
 */
const imageUploaderHandler = async (files) => {
  try {
    const uploaded = await Promise.all(
      files.map(async (item) => {
        try {
          const result = await cloudinary.v2.uploader.upload(item.path, {
            folder: "British Automotive",
          });
          return { ...result };
        } catch (error) {
          console.error("Error uploading image:", error);
          const err = new Error(error.message || "Error uploading image");
          err.name = error.name || "UNPROCESSABLE_ENTITY";
          err.statusCode = error.httpCode || 500;
          err.isOperational = error.isOperational || false;
          throw err;

        }
      })
    );
    return uploaded;
  } catch (err) {
    throw err;
  }
};

module.exports = { uploadFilesService };
