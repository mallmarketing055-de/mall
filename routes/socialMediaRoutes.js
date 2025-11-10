const express = require("express");
const authMiddleware = require('../middelwares/authorization');
const router = express.Router();
const {
  createLink,
  getLinks,
  updateLink,
  deleteLink,
  getLinkById,
} = require("../controller/socialMediaController");

// If you use authentication middleware like `requireAuth`, add it here
// router.use(requireAuth);

router.post("/",
    authMiddleware.auth, 
  authMiddleware.isAdmin,
  createLink);
router.get("/", getLinks);
router.get("/:id", getLinkById); // ✅ get specific link
router.put("/:id",
    authMiddleware.auth, 
  authMiddleware.isAdmin,
  updateLink);
router.delete("/:id",
    authMiddleware.auth, 
  authMiddleware.isAdmin,
  deleteLink);

module.exports = router;
