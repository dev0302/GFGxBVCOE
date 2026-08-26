const BlogCategory = require("../models/BlogCategory");

const DEFAULT_BLOG_CATEGORIES = [
  "Web Development",
  "React",
  "JavaScript",
  "CSS",
  "Design",
  "Community",
  "Career",
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findCategoryByName = (name) =>
  BlogCategory.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
  });

const ensureDefaultCategories = async () => {
  const count = await BlogCategory.countDocuments();
  if (count > 0) return;

  await BlogCategory.insertMany(
    DEFAULT_BLOG_CATEGORIES.map((name) => ({ name })),
    { ordered: false },
  ).catch(() => {});
};

const listCategoryNames = async () => {
  await ensureDefaultCategories();
  const categories = await BlogCategory.find().sort({ name: 1 }).select("name");
  return categories.map((category) => category.name);
};

const ensureCategoryExists = async (rawName) => {
  const trimmed = String(rawName || "").trim();
  if (!trimmed) return null;

  const existing = await findCategoryByName(trimmed);
  if (existing) return existing.name;

  try {
    const created = await BlogCategory.create({ name: trimmed });
    return created.name;
  } catch (error) {
    if (error?.code === 11000) {
      const duplicate = await findCategoryByName(trimmed);
      return duplicate?.name || trimmed;
    }
    throw error;
  }
};

module.exports = {
  DEFAULT_BLOG_CATEGORIES,
  ensureCategoryExists,
  ensureDefaultCategories,
  findCategoryByName,
  listCategoryNames,
};
