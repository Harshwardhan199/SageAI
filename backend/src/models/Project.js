const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

function generateSlug(name) {
  const base = (name || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = uuidv4().substring(0, 8);
  return base ? `${base}-${suffix}` : suffix;
}

const projectSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true },
    color: { type: String, default: "#ffffff" },
    description: { type: String, default: "" },
    sharedContext: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

projectSchema.pre("validate", function (next) {
  if (!this.slug) {
    this.slug = generateSlug(this.name);
  }
  next();
});

projectSchema.index({ userId: 1, isHidden: 1 });
projectSchema.index({ userId: 1, isDefault: 1 });

const Project = mongoose.model("Project", projectSchema);

// Clean up legacy non-sparse index if exists in MongoDB collection
Project.collection.dropIndex("slug_1").catch(() => {});

module.exports = Project;
