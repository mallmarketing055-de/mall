import multer from "multer";
import { format } from "date-fns";
import cloudinary from "cloudinary";
import dotenv from "dotenv";


dotenv.config({
    path: './config/.env',
});

// ✅ Cloudinary Config
cloudinary.v2.config({
  cloud_name: "djwllkrbt",
  api_key: "417578421962993",
  api_secret:"drreGh-49pBxL6fSRFoBgIDORXo",
});


console.log("Cloudinary Configured:", {
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process  .env.CLOUDINARY_API_KEY ? "****" : "Not Set",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "****": "Not Set",})
/*
  *****************************************
             multer config
  *****************************************
 */
const fileStorage = multer.diskStorage({
  filename: (_req, file, cb) => {
    const date = format(new Date(), "dd-MM-yy");
    const fileType = file.mimetype === "application/pdf" ? "PDF" : "IMAGE";
    const fileNameFormat = `${date}-${fileType}-${file.originalname}`;
    cb(null, fileNameFormat);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|gif|png)$/i)) {
    cb(null, false);
  } else {
    cb(null, true);
  }
};

export const multerUtil = multer({
  storage: fileStorage,
  fileFilter,
});
