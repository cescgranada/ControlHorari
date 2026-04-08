import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { createUser } from "../src/server/repositories/user.repository";
import fs from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error(".env file not found");
    return;
  }
  const envFile = fs.readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && !key.startsWith("#")) {
      const value = valueParts.join("=").trim();
      if (value) {
        process.env[key.trim()] = value;
      }
    }
  });
}

loadEnv();

async function main() {
  const email = process.argv[2];
  const fullName = process.argv[3] ?? "Usuari Nou";
  const role = (process.argv[4] ?? "admin") as "admin" | "worker";

  if (!email) {
    console.error("Us: npx tsx scripts/create-admin.ts <email> [nom] [rol]");
    process.exit(1);
  }

  console.log(`Checking if user ${email} already exists...`);

  const admin = createSupabaseAdminClient();
  const { data: users } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });
  const existingUser = users?.users.find((u) => u.email === email);

  if (existingUser) {
    console.log(`User ${email} already exists with ID: ${existingUser.id}`);
    console.log("Updating profile to ensure role is admin...");
    const { error } = await admin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", existingUser.id);
    if (error) {
      console.error("Error updating profile:", error);
    } else {
      console.log("Profile updated successfully.");
    }
    return;
  }

  console.log(`Creating admin user ${email}...`);

  try {
    const result = await createUser({
      email,
      full_name: fullName,
      role,
      department: null,
      weekly_hours: 40
    });

    console.log("User created successfully!");
    console.log(`User ID: ${result.user.id}`);
    console.log(`Temporary password: ${result.temporaryPassword}`);
    console.log("Please login with this password and change it immediately.");
  } catch (error) {
    console.error("Error creating user:", error);
    process.exit(1);
  }
}

main().catch(console.error);
