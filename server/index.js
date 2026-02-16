const express = require("express");
require("dotenv").config();

const dbConnect = require("./config/database");
const { cloudinaryConnect } = require("./config/cloudinary");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");

const eventRoutes = require("./routes/eventRoute");
const authRoutes = require("./routes/authRoute");
const teamRoutes = require("./routes/teamRoute");

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp",
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max
    abortOnLimit: true,
  })
);

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your Server is up and running....",
  });
});

app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/team", teamRoutes);

dbConnect()
  .then(() => {
    cloudinaryConnect();
    app.listen(PORT, () => {
      console.log(`Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Server could not start:", err);
    process.exit(1);
  });
