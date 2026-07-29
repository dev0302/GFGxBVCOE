require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { getInviteSubmissionRecipients } = require("../utils/notificationService");

async function main() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const society = await User.find({
    accountType: { $in: ["ADMIN", "Chairperson", "Vice-Chairperson"] },
  })
    .select("email accountType")
    .lean();
  console.log("society users:", society.length, society.map((u) => u.email));

  const tech = await User.find({ accountType: "Technical" })
    .populate("additionalDetails", "position p0 p1 p2")
    .select("email accountType additionalDetails")
    .lean();
  console.log("technical users:", JSON.stringify(tech, null, 2));

  const recipients = await getInviteSubmissionRecipients("Technical");
  console.log("recipients for Technical:", recipients);

  const notifs = await Notification.find().sort({ createdAt: -1 }).limit(5).lean();
  console.log("recent notifications:", notifs.length, JSON.stringify(notifs, null, 2));

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
