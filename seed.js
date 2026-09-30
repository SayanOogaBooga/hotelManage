const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hotel-management";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: "ADMIN" },
  permissions: {
    canEdit: { type: Boolean, default: true },
    canCreate: { type: Boolean, default: true },
    canDelete: { type: Boolean, default: true },
    canManageUsers: { type: Boolean, default: true },
    canViewRevenue: { type: Boolean, default: true },
  }
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB");

  const existingAdmin = await User.findOne({ email: "admin@hotel.com" });
  if (existingAdmin) {
    console.log("Admin already exists!");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await User.create({
    email: "admin@hotel.com",
    password: hashedPassword,
    name: "Master Admin",
    role: "ADMIN",
    permissions: {
      canEdit: true,
      canCreate: true,
      canDelete: true,
      canManageUsers: true,
      canViewRevenue: true,
    }
  });

  console.log("Admin seeded! Email: admin@hotel.com | Password: admin123");
  process.exit(0);
}

seed().catch(console.error);
