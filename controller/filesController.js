const { uploadFilesService } = require("../services/file.service");

/**
 * Handles file upload requests
 */
const uploadFileController = async (req, res, next) => {
  try {
    console.log(req.files);
    console.log(req.file);

    const result = await uploadFilesService(req.files);

    return res.status(result.status).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadFileController };
