const express = require("express");
const router = express.Router();
const vaultController = require("../controllers/vaultController");
const { optionalAuth } = require("../middlewares/AuthZ");

router.get("/items", optionalAuth, vaultController.getVaultItems);
router.get("/share/:shareToken", vaultController.getPublicShareItems);
router.post("/folders", optionalAuth, vaultController.createFolder);
router.delete("/folders/:id", optionalAuth, vaultController.deleteFolder);
router.put("/folders/:id/lock", optionalAuth, vaultController.toggleFolderLock);
router.post("/upload", optionalAuth, vaultController.uploadDocument);
router.delete("/documents/:id", optionalAuth, vaultController.deleteDocument);
router.put("/documents/:id/lock", optionalAuth, vaultController.toggleDocumentLock);

module.exports = router;
