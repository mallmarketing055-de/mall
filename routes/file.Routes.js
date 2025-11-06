const express = require("express");
const router = express.Router();

const { uploadFileController } = require("../controller/filesController");
const { multerUtil } = require("../services/file.trait");

// ✅ Define route for uploading files
router.post("/", multerUtil.array("files"), uploadFileController);

module.exports = router;
