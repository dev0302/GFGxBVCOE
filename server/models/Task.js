const mongoose = require("mongoose");

const personSchema = new mongoose.Schema(
  {
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    image: { type: String, default: "" },
    department: { type: String, default: "" },
    role: { type: String, default: "" },
    year: { type: String, default: "" },
    isDepartmentMember: { type: Boolean, default: false },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, required: true, trim: true, maxlength: 10000 },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    assignedTo: { type: personSchema, required: true, index: true },
    assignedBy: { type: personSchema, required: true },
    department: { type: String, required: true, trim: true, index: true },
    deadline: { type: Date, default: null, index: true },
    status: { type: String, enum: ["ONGOING", "COMPLETED", "DELETED"], default: "ONGOING", index: true },
    completedAt: { type: Date, default: null },
    completedBy: { type: personSchema, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: personSchema, default: null },
    history: [{ action: { type: String, required: true }, at: { type: Date, default: Date.now }, by: personSchema }],
  },
  { timestamps: true }
);

taskSchema.index({ "assignedTo.id": 1, createdAt: -1 });
taskSchema.index({ department: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Task", taskSchema);
