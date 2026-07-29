require("dotenv").config();
const mongoose = require("mongoose");
const { migrateDepartmentNames } = require("../utils/departmentMigration");

async function run() {
  await mongoose.connect(process.env.DATABASE_URL);
  await migrateDepartmentNames();
  console.log("Treasurer migrated from department to core role.");
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Treasurer migration failed:", error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
