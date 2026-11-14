import { PrismaClient, WorkspacePlan, MemberRole } from "@prisma/client";
import { createHash, randomBytes } from "crypto";

// ============================================================
// Database Seed Script
// Usage: pnpm db:seed
// ============================================================

const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal bcrypt-like hash using Node's built-in crypto.
 * In production, use `bcryptjs` or `argon2`.  The seed only
 * creates dev/test accounts so a simple PBKDF2 is fine here.
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(salt + password)
    .digest("hex");
  // Format: $sha256$<salt>$<hash>  (non-production placeholder)
  return `$sha256$${salt}$${hash}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("🌱 Starting database seed…");

  // ------------------------------------------------------------------
  // 1. Super-admin user
  // ------------------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@postlane.app";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme-dev-only";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Postlane Admin";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      name: adminName,
      emailVerified: true,
      twoFactorEnabled: false,
    },
  });

  console.log(`✅ Super-admin user: ${admin.email} (id: ${admin.id})`);

  // ------------------------------------------------------------------
  // 2. Demo workspace for the admin
  // ------------------------------------------------------------------
  const workspaceName = "Postlane HQ";
  const workspaceSlug = slugify(workspaceName);

  const workspace = await prisma.workspace.upsert({
    where: { slug: workspaceSlug },
    update: {},
    create: {
      name: workspaceName,
      slug: workspaceSlug,
      timezone: "UTC",
      plan: WorkspacePlan.PROFESSIONAL,
      members: {
        create: {
          userId: admin.id,
          role: MemberRole.OWNER,
        },
      },
    },
  });

  console.log(
    `✅ Demo workspace: "${workspace.name}" (slug: ${workspace.slug})`
  );

  // ------------------------------------------------------------------
  // 3. Free-tier subscription record for the workspace
  // ------------------------------------------------------------------
  await prisma.subscription.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: {
      workspaceId: workspace.id,
      plan: WorkspacePlan.PROFESSIONAL,
      status: "ACTIVE",
    },
  });

  console.log(`✅ Subscription record created for workspace`);

  // ------------------------------------------------------------------
  // 4. Demo second workspace member (viewer)
  // ------------------------------------------------------------------
  const viewerEmail = process.env.SEED_VIEWER_EMAIL ?? "viewer@postlane.app";

  const viewer = await prisma.user.upsert({
    where: { email: viewerEmail },
    update: {},
    create: {
      email: viewerEmail,
      passwordHash: await hashPassword("viewer-changeme"),
      name: "Demo Viewer",
      emailVerified: true,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: viewer.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: viewer.id,
      role: MemberRole.VIEWER,
      invitedBy: admin.id,
    },
  });

  console.log(`✅ Demo viewer member: ${viewer.email} (id: ${viewer.id})`);

  // ------------------------------------------------------------------
  // Done
  // ------------------------------------------------------------------
  console.log("\n🎉 Seed complete!");
  console.log("──────────────────────────────────────────────");
  console.log(`Admin email    : ${adminEmail}`);
  console.log(`Admin password : ${adminPassword}`);
  console.log(`Viewer email   : ${viewerEmail}`);
  console.log(`Viewer password: viewer-changeme`);
  console.log("──────────────────────────────────────────────");
  console.log(
    "⚠️  Change these credentials immediately in any non-local environment!"
  );
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
