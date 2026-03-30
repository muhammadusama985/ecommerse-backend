import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { User } from "../models/user.model.js";

const DEFAULT_ADMIN = {
  email: "owneradmin@naturerepublic.com",
  password: "OwnerAdmin123!",
  firstName: "Owner",
  lastName: "Admin",
  phone: "",
};

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return "";
  }
  return process.argv[index + 1];
}

function printUsage() {
  console.log("Usage:");
  console.log('npm run create-admin -- --email "admin@example.com" --password "StrongPass123!" --first-name "Admin" --last-name "User"');
}

async function main() {
  const email = (getArgValue("--email") || DEFAULT_ADMIN.email).toLowerCase().trim();
  const password = getArgValue("--password") || DEFAULT_ADMIN.password;
  const firstName = getArgValue("--first-name") || DEFAULT_ADMIN.firstName;
  const lastName = getArgValue("--last-name") || DEFAULT_ADMIN.lastName;
  const phone = getArgValue("--phone") || DEFAULT_ADMIN.phone;

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  await connectDatabase();

  const existingUser = await User.findOne({ email }).select("+password");

  if (existingUser) {
    existingUser.firstName = firstName || existingUser.firstName;
    existingUser.lastName = lastName || existingUser.lastName;
    existingUser.phone = phone || existingUser.phone;
    existingUser.password = password;
    existingUser.role = "admin";
    await existingUser.save();

    console.log(`Updated existing user as admin: ${existingUser.email}`);
  } else {
    const admin = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: "admin",
    });

    console.log(`Created admin user: ${admin.email}`);
  }
}

main()
  .catch((error) => {
    console.error("Create admin failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
