const VaultFolder = require("../models/VaultFolder");
const VaultDocument = require("../models/VaultDocument");
const User = require("../models/User");
const { cloudinary } = require("../config/cloudinary");

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function getResizedCloudinaryAvatar(name, pic) {
  if (pic && typeof pic === "string" && pic.startsWith("http")) {
    if (pic.includes("cloudinary.com")) {
      if (pic.includes("w_64,h_64")) return pic;
      if (pic.includes("/upload/")) {
        return pic.replace("/upload/", "/upload/w_64,h_64,c_fill,g_face,f_auto,q_auto/");
      }
    }
    return pic;
  }
  const safeName = name ? encodeURIComponent(name) : "User";
  return `https://ui-avatars.com/api/?name=${safeName}&background=0284c7&color=fff&bold=true`;
}

function sanitizeName(rawName) {
  if (!rawName) return "Event Management Lead";
  if (rawName.includes("@")) {
    const prefix = rawName.split("@")[0];
    return prefix.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return rawName;
}

async function getUserDetails(req, defaultFallbackName = "Event Management Lead") {
  let name = defaultFallbackName;
  let avatar = "";
  let email = req.user?.email || "";

  const userId = req.user?.id || req.user?._id;
  if (userId) {
    try {
      const user = await User.findById(userId).select("firstName lastName email image");
      if (user) {
        if (user.firstName || user.lastName) {
          name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        } else if (user.email) {
          name = sanitizeName(user.email);
        }
        if (user.email) email = user.email;
        avatar = user.image || "";
      }
    } catch (e) {
      console.error("Error fetching user details in vault:", e.message);
    }
  }

  if (name === defaultFallbackName) {
    if (req.user?.name) {
      name = sanitizeName(req.user.name);
    } else if (req.user?.fullName) {
      name = sanitizeName(req.user.fullName);
    } else if (req.user?.email) {
      name = sanitizeName(req.user.email);
      email = req.user.email;
    }
    if (!avatar) avatar = req.user?.profilePic || req.user?.image || req.user?.avatar || "";
  }

  const formattedAvatar = getResizedCloudinaryAvatar(name, avatar);
  return { name, avatar: formattedAvatar, email };
}

function isSameUser(userEmail, userName, itemCreatedByEmail, itemCreatedBy) {
  if (userEmail && itemCreatedByEmail && userEmail.toLowerCase() === itemCreatedByEmail.toLowerCase()) {
    return true;
  }
  if (userEmail && itemCreatedBy && itemCreatedBy.toLowerCase() === userEmail.toLowerCase()) {
    return true;
  }
  if (userName && itemCreatedBy && itemCreatedBy.toLowerCase() === userName.toLowerCase()) {
    return true;
  }
  if (!itemCreatedByEmail && !itemCreatedBy) {
    return true;
  }
  return false;
}

function sanitizeItem(item) {
  const obj = item.toObject ? item.toObject() : item;
  if (!obj.createdByEmail && obj.createdBy && obj.createdBy.includes("@")) {
    obj.createdByEmail = obj.createdBy;
  }
  obj.createdBy = sanitizeName(obj.createdBy);
  if (!obj.createdByAvatar || !obj.createdByAvatar.includes("w_64")) {
    obj.createdByAvatar = getResizedCloudinaryAvatar(obj.createdBy, obj.createdByAvatar);
  }
  return obj;
}

// 1. Get all folders & documents (synced across all departments)
exports.getVaultItems = async (req, res) => {
  try {
    const folders = await VaultFolder.find().sort({ createdAt: -1 });
    const documents = await VaultDocument.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      folders: folders.map(sanitizeItem),
      documents: documents.map(sanitizeItem),
    });
  } catch (error) {
    console.error("getVaultItems error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Create new folder
exports.createFolder = async (req, res) => {
  try {
    const { name, parentId, color, department } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Folder name is required." });
    }

    const { name: uploaderName, avatar: uploaderAvatar, email: uploaderEmail } = await getUserDetails(req, "Event Management Lead");

    const folder = await VaultFolder.create({
      name: name.trim(),
      parentId: parentId || null,
      color: color || "cyan",
      department: department || "all",
      createdBy: uploaderName,
      createdByAvatar: uploaderAvatar,
      createdByEmail: uploaderEmail,
    });
    return res.status(201).json({ success: true, folder: sanitizeItem(folder) });
  } catch (error) {
    console.error("createFolder error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Delete folder (If locked, NO ONE can delete it until it is unlocked first!)
exports.deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await VaultFolder.findById(id);
    if (!folder) {
      return res.status(404).json({ success: false, message: "Folder not found in DB." });
    }

    if (folder.isLocked) {
      return res.status(403).json({
        success: false,
        message: `Folder "${folder.name}" is locked! Nobody (including the person who locked it) can delete it while locked. Please unlock it first.`,
      });
    }

    const docs = await VaultDocument.find({ folderId: id });
    for (const doc of docs) {
      if (doc.public_id) {
        try {
          await cloudinary.uploader.destroy(doc.public_id, {
            resource_type: doc.resource_type || "auto",
          });
        } catch (e) {
          console.error("Cloudinary destroy error:", doc.public_id, e.message);
        }
      }
    }

    await VaultDocument.deleteMany({ folderId: id });
    await VaultFolder.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: "Folder and all files deleted from DB & Cloudinary." });
  } catch (error) {
    console.error("deleteFolder error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Upload single or multiple documents directly to Cloudinary
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    const rawFiles = req.files.file;
    const fileList = Array.isArray(rawFiles) ? rawFiles : [rawFiles];
    const { folderId, description, department } = req.body || {};
    
    const { name: uploaderName, avatar: uploaderAvatar, email: uploaderEmail } = await getUserDetails(req, "Event Management Member");

    const createdDocs = [];

    for (const file of fileList) {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "gfg_document_vault",
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
      });

      const newDoc = await VaultDocument.create({
        name: file.name,
        folderId: folderId || null,
        department: department || "all",
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type || "auto",
        type: file.mimetype || "application/octet-stream",
        size: formatBytes(file.size),
        description: description || "",
        createdBy: uploaderName,
        createdByAvatar: uploaderAvatar,
        createdByEmail: uploaderEmail,
      });

      createdDocs.push(sanitizeItem(newDoc));
    }

    return res.status(201).json({
      success: true,
      document: createdDocs.length === 1 ? createdDocs[0] : undefined,
      documents: createdDocs,
    });
  } catch (error) {
    console.error("uploadDocument error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delete document (If locked, NO ONE can delete it until it is unlocked first!)
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await VaultDocument.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found in DB." });
    }

    if (doc.isLocked) {
      return res.status(403).json({
        success: false,
        message: `Document "${doc.name}" is locked! Nobody (including the person who locked it) can delete it while locked. Please unlock it first.`,
      });
    }

    if (doc.public_id) {
      try {
        await cloudinary.uploader.destroy(doc.public_id, {
          resource_type: doc.resource_type || "auto",
        });
        console.log(`Cloudinary asset destroyed immediately: ${doc.public_id}`);
      } catch (cloudinaryErr) {
        console.error("Cloudinary destroy error:", cloudinaryErr.message);
      }
    }

    await VaultDocument.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: "Document deleted from Cloudinary and DB immediately." });
  } catch (error) {
    console.error("deleteDocument error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Toggle Folder Lock Status (Requires matching creator email)
exports.toggleFolderLock = async (req, res) => {
  try {
    const { id } = req.params;
    const folder = await VaultFolder.findById(id);
    if (!folder) {
      return res.status(404).json({ success: false, message: "Folder not found." });
    }

    const { name: currentUserName, email: currentUserEmail } = await getUserDetails(req, "Event Management Lead");
    
    // Validate creator email match
    if (folder.createdByEmail || folder.createdBy) {
      const allowed = isSameUser(currentUserEmail, currentUserName, folder.createdByEmail, folder.createdBy);
      if (!allowed) {
        const ownerInfo = folder.createdByEmail || folder.createdBy || "the uploader";
        return res.status(403).json({
          success: false,
          message: `Only the person who created/uploaded this folder (${ownerInfo}) is allowed to lock or unlock it!`,
        });
      }
    }

    folder.isLocked = !folder.isLocked;
    folder.lockedBy = folder.isLocked ? (currentUserEmail || currentUserName) : "";
    await folder.save();

    return res.status(200).json({
      success: true,
      message: folder.isLocked
        ? `Folder "${folder.name}" locked successfully!`
        : `Folder "${folder.name}" unlocked!`,
      folder: sanitizeItem(folder),
    });
  } catch (error) {
    console.error("toggleFolderLock error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Toggle Document Lock Status (Requires matching creator email)
exports.toggleDocumentLock = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await VaultDocument.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    const { name: currentUserName, email: currentUserEmail } = await getUserDetails(req, "Event Management Member");
    
    // Validate creator email match
    if (doc.createdByEmail || doc.createdBy) {
      const allowed = isSameUser(currentUserEmail, currentUserName, doc.createdByEmail, doc.createdBy);
      if (!allowed) {
        const ownerInfo = doc.createdByEmail || doc.createdBy || "the uploader";
        return res.status(403).json({
          success: false,
          message: `Only the person who uploaded this document (${ownerInfo}) is allowed to lock or unlock it!`,
        });
      }
    }

    doc.isLocked = !doc.isLocked;
    doc.lockedBy = doc.isLocked ? (currentUserEmail || currentUserName) : "";
    await doc.save();

    return res.status(200).json({
      success: true,
      message: doc.isLocked
        ? `Document "${doc.name}" locked successfully!`
        : `Document "${doc.name}" unlocked!`,
      document: sanitizeItem(doc),
    });
  } catch (error) {
    console.error("toggleDocumentLock error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Public Share items endpoint (no auth required)
exports.getPublicShareItems = async (req, res) => {
  try {
    const { shareToken } = req.params;
    let itemId = null;
    let type = "folder";
    try {
      const decoded = Buffer.from(shareToken, "base64").toString("utf-8");
      const parts = decoded.split(":");
      if (parts.length >= 2) {
        type = parts[0];
        itemId = parts[1];
      }
    } catch (e) {
      // fallback
    }

    if (type === "doc" && itemId) {
      const doc = await VaultDocument.findById(itemId);
      return res.status(200).json({
        success: true,
        type: "doc",
        documents: doc ? [sanitizeItem(doc)] : [],
      });
    }

    if (itemId) {
      const folder = await VaultFolder.findById(itemId);
      const docs = await VaultDocument.find({ folderId: itemId });
      const subFolders = await VaultFolder.find({ parentId: itemId });
      return res.status(200).json({
        success: true,
        type: "folder",
        folder: folder ? sanitizeItem(folder) : null,
        documents: docs.map(sanitizeItem),
        folders: subFolders.map(sanitizeItem),
      });
    }

    const folders = await VaultFolder.find().sort({ createdAt: -1 });
    const documents = await VaultDocument.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      type: "all",
      folders: folders.map(sanitizeItem),
      documents: documents.map(sanitizeItem),
    });
  } catch (error) {
    console.error("getPublicShareItems error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
