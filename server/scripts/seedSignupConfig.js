require("dotenv").config();
const mongoose = require("mongoose");
const SignupConfig = require("../models/SignupConfig");

const DEPARTMENTS = [
  "ADMIN",
  "Social Media and Promotion",
  "Technical",
  "Event Management",
  "Public Relation and Outreach",
  "Design",
  "Content and Documentation",
  "Photography and Videography",
  "Sponsorship and Marketing",
];

async function seed() {
  await mongoose.connect(process.env.DATABASE_URL);
  for (const dept of DEPARTMENTS) {
    await SignupConfig.findOneAndUpdate(
      { department: dept },
      { $setOnInsert: { department: dept, allowedEmails: [] } },
      { upsert: true }
    );
    console.log("Department:", dept);
  }
  console.log("SignupConfig seeded. Add allowed emails to each department in MongoDB.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
