import EmbeddedPostgres from "embedded-postgres";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DEMO_PASSWORD, DEMO_USERS } from "../lib/seed-data";

const dataDir = path.join(process.cwd(), ".pgdata");
const databaseUrl = "postgresql://postgres:postgres@localhost:5432/homeconnect?schema=public";

async function main() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "postgres",
    password: "postgres",
    port: 5432,
    persistent: true,
  });

  console.log("Starting embedded PostgreSQL...");
  if (!existsSync(path.join(dataDir, "PG_VERSION"))) {
    await pg.initialise();
  }
  await pg.start();

  try {
    await pg.createDatabase("homeconnect");
  } catch {
    // database may already exist
  }

  console.log("Pushing schema...");
  execSync("./node_modules/.bin/prisma db push", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  console.log("Seeding demo users and properties...");
  execSync("./node_modules/.bin/tsx prisma/seed.ts", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  const envPath = path.join(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const env = readFileSync(envPath, "utf8");
    const updated = env.includes("DATABASE_URL=")
      ? env.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${databaseUrl}"`)
      : `${env.trim()}\nDATABASE_URL="${databaseUrl}"\n`;
    writeFileSync(envPath, updated);
    console.log("\nUpdated .env.local with DATABASE_URL");
  }

  console.log("\n=== Demo credentials ===");
  console.log(`Password (all accounts): ${DEMO_PASSWORD}\n`);
  for (const user of DEMO_USERS) {
    console.log(`  ${user.role.padEnd(10)} ${user.email}`);
  }
  console.log("\nPostgreSQL is running on localhost:5432 (data in .pgdata/)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
