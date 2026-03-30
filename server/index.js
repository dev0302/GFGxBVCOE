require("dotenv").config();
const express = require("express");
const http = require("http");
const dbConnect = require("./config/database");
const { cloudinaryConnect } = require("./config/cloudinary");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("./models/User");

const descriptionRouter = require("./routes/generateDescription");
const eventRoutes = require("./routes/eventRoute");
const authRoutes = require("./routes/authRoute");
const teamRoutes = require("./routes/teamRoute");
const activityLogRoutes = require("./routes/activityLogRoute");
const jamTheWebRoutes = require("./routes/jamTheWebRoute");
const dashboardRoutes = require("./routes/dashboardRoute");
const aiRoutes = require("./routes/aiRoutes");



const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 8080;

// ✅ Middleware first
// app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp",
  limits: { fileSize: 200 * 1024 * 1024 },
  abortOnLimit: true,
}));

// ✅ Routes second
app.get("/", (req, res) => {
  return res.json({ success: true, message: "Your Server is up and running...." });
});

app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/team", teamRoutes);
app.use("/api/v1/activity-logs", activityLogRoutes);
app.use("/api/v1/jamtheweb", jamTheWebRoutes);
app.use("/api/v1/dashboards", dashboardRoutes);
app.use("/api", descriptionRouter);
app.use("/api/v1/ai", aiRoutes);

// ✅ 404 handler LAST — after all routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});
app.use(express.json({ limit: "10mb" }));

const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});

const onlineUsers = new Map();
const socketIdToUserId = new Map();

function emitOnlineUsers() {
  const users = Array.from(onlineUsers.values())
    .map((entry) => entry.user)
    .sort((a, b) => a.name.localeCompare(b.name));
  io.emit("online-users", users);
}

function emitToUser(userId, eventName, payload) {
  const entry = onlineUsers.get(String(userId));
  if (!entry) return;
  entry.socketIds.forEach((sid) => io.to(sid).emit(eventName, payload));
}

function getTokenFromCookieHeader(cookieHeader = "") {
  if (!cookieHeader || typeof cookieHeader !== "string") return null;
  const parts = cookieHeader.split(";").map((s) => s.trim());
  for (const part of parts) {
    if (part.startsWith("Token=")) {
      return decodeURIComponent(part.slice("Token=".length));
    }
  }
  return null;
}

io.use(async (socket, next) => {
  try {
    const rawAuthHeader = socket.handshake.headers?.authorization || "";
    const headerToken = rawAuthHeader.startsWith("Bearer ")
      ? rawAuthHeader.slice(7)
      : null;
    const cookieToken = getTokenFromCookieHeader(
      socket.handshake.headers?.cookie || ""
    );
    const token = socket.handshake.auth?.token || headerToken || cookieToken;
    if (!token) {
      return next(new Error("Missing token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .select("firstName lastName image")
      .lean();

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = {
      id: String(user._id),
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
      image: user.image || "",
    };

    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const { id } = socket.user;
  const existing = onlineUsers.get(id);

  if (existing) {
    existing.socketIds.add(socket.id);
  } else {
    onlineUsers.set(id, {
      user: socket.user,
      socketIds: new Set([socket.id]),
    });
  }
  socketIdToUserId.set(socket.id, id);

  emitOnlineUsers();

  socket.on("join-dashboard", () => {
    emitOnlineUsers();
  });

  socket.on("send-upload-request", (payload = {}) => {
    const receiverId = String(payload.receiverId || "");
    if (!receiverId) return;
    emitToUser(receiverId, "receive-upload-request", {
      requestId: payload.requestId,
      senderId: id,
      senderName: socket.user.name,
      senderImage: socket.user.image,
      eventMeta: payload.eventMeta || null,
      at: Date.now(),
    });
  });

  socket.on("upload-request-opened", (payload = {}) => {
    const targetUserId = String(payload.targetUserId || "");
    if (!targetUserId) return;
    emitToUser(targetUserId, "upload-request-opened", {
      ...payload,
      senderId: id,
      at: Date.now(),
    });
  });

  socket.on("upload-request-closed", (payload = {}) => {
    const targetUserId = String(payload.targetUserId || "");
    if (!targetUserId) return;
    emitToUser(targetUserId, "upload-request-closed", {
      ...payload,
      senderId: id,
      at: Date.now(),
    });
  });

  socket.on("upload-progress", (payload = {}) => {
    const targetUserId = String(payload.targetUserId || "");
    if (!targetUserId) return;
    emitToUser(targetUserId, "upload-progress", {
      ...payload,
      senderId: id,
      at: Date.now(),
    });
  });

  socket.on("upload-complete", (payload = {}) => {
    const targetUserId = String(payload.targetUserId || "");
    if (!targetUserId) return;
    emitToUser(targetUserId, "upload-complete", {
      ...payload,
      senderId: id,
      at: Date.now(),
    });
  });

  socket.on("new-image-added", (payload = {}) => {
    const targetUserId = String(payload.targetUserId || "");
    if (!targetUserId) return;
    const eventPayload = {
      ...payload,
      senderId: id,
      at: Date.now(),
    };
    emitToUser(targetUserId, "new-image-added", eventPayload);
    emitToUser(targetUserId, "image-added", eventPayload);
  });

  socket.on("image-removed", (payload = {}) => {
    const targetUserId = String(payload.targetUserId || "");
    if (!targetUserId) return;
    emitToUser(targetUserId, "image-removed", {
      ...payload,
      senderId: id,
      at: Date.now(),
    });
  });

  socket.on("images-sync", (payload = {}) => {
    const targetUserId = String(payload.targetUserId || "");
    if (!targetUserId) return;
    emitToUser(targetUserId, "images-sync", {
      ...payload,
      senderId: id,
      at: Date.now(),
    });
  });

  socket.on("disconnect", () => {
    socketIdToUserId.delete(socket.id);
    const entry = onlineUsers.get(id);
    if (!entry) return;
    entry.socketIds.delete(socket.id);
    if (entry.socketIds.size === 0) {
      onlineUsers.delete(id);
    }
    emitOnlineUsers();
  });
});

dbConnect()
  .then(() => {
    cloudinaryConnect();
    httpServer.listen(PORT, () =>
      console.log(`Server running on port: ${PORT}`)
    );
  })
  .catch((err) => {
    console.log("Server could not start:", err);
    process.exit(1);
  });