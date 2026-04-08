import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
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

  if (!email) {
    console.error("Us: npx tsx scripts/check-user.ts <email>");
    process.exit(1);
  }

  const admin = createSupabaseAdminClient();

  console.log(`Checking user ${email} in auth...`);
  const { data: users } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });
  const user = users?.users.find((u) => u.email === email);
  if (!user) {
    console.log("User not found in auth.");
    return;
  }
  console.log(`Auth user ID: ${user.id}`);
  console.log(`Email confirmed: ${user.email_confirmed_at ? "Yes" : "No"}`);
  console.log(`Last sign-in: ${user.last_sign_in_at}`);

  console.log("\nChecking profile...");
  const { data: profile, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error || !profile) {
    console.error("Error fetching profile:", error);
    return;
  }
  console.log(`Profile role: ${profile.role}`);
  console.log(`Profile active: ${profile.is_active}`);
  console.log(`Full name: ${profile.full_name}`);
}

main().catch(console.error);
