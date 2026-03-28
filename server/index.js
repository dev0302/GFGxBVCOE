require("dotenv").config();
const express = require("express");
const dbConnect = require("./config/database");
const { cloudinaryConnect } = require("./config/cloudinary");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");

const descriptionRouter = require("./routes/generateDescription");
const eventRoutes = require("./routes/eventRoute");
const authRoutes = require("./routes/authRoute");
const teamRoutes = require("./routes/teamRoute");
const activityLogRoutes = require("./routes/activityLogRoute");
const jamTheWebRoutes = require("./routes/jamTheWebRoute");
const dashboardRoutes = require("./routes/dashboardRoute");
const aiRoutes = require("./routes/aiRoutes");



const app = express();
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

dbConnect()
  .then(() => {
    cloudinaryConnect();
    app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
  })
  .catch((err) => {
    console.log("Server could not start:", err);
    process.exit(1);
  });