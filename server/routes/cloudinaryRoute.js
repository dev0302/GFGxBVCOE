const express = require("express");
const { getImagesFromCloudinaryFolder } = require("../config/cloudinary");

const router = express.Router();

const fetchImagesByFolder = async (req, res) => {
  try {
    const folder = (req.query.folder || req.params.folder || "")
      .toString()
      .trim();

    if (!folder) {
      return res.status(400).json({
        success: false,
        message:
          "Folder name is required. Use ?folder=your-folder or /images/:folder",
      });
    }

    const images = await getImagesFromCloudinaryFolder(folder);

    return res.status(200).json({
      success: true,
      folder,
      count: images.length,
      images,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch images from Cloudinary",
    });
  }
};

router.get("/images", fetchImagesByFolder);
router.get("/images/:folder", fetchImagesByFolder);

module.exports = router;
