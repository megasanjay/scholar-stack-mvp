import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const truncateTables = async () => {
  console.log("Truncating tables...");

  console.log("Truncating table CollectionAccess...");
  await prisma.$executeRaw`TRUNCATE TABLE "CollectionAccess" RESTART IDENTITY CASCADE`;

  console.log("Truncating table Invite...");
  await prisma.$executeRaw`TRUNCATE TABLE "Invite" RESTART IDENTITY CASCADE`;

  console.log("Truncating table WorkspaceMember...");
  await prisma.$executeRaw`TRUNCATE TABLE "WorkspaceMember" RESTART IDENTITY CASCADE`;

  console.log("Truncating table Workspace...");
  await prisma.$executeRaw`TRUNCATE TABLE "Workspace" RESTART IDENTITY CASCADE`;

  console.log("Truncating table Collection...");
  await prisma.$executeRaw`TRUNCATE TABLE "Collection" RESTART IDENTITY CASCADE`;

  console.log("Truncating table Version...");
  await prisma.$executeRaw`TRUNCATE TABLE "Version" RESTART IDENTITY CASCADE`;

  console.log("Truncating table InternalRelation...");
  await prisma.$executeRaw`TRUNCATE TABLE "InternalRelation" RESTART IDENTITY CASCADE`;

  console.log("Truncating table ExternalRelation...");
  await prisma.$executeRaw`TRUNCATE TABLE "ExternalRelation" RESTART IDENTITY CASCADE`;

  console.log("Truncating table Resource...");
  await prisma.$executeRaw`TRUNCATE TABLE "Resource" RESTART IDENTITY CASCADE`;

  console.log("Truncating table _InternalRelationToVersion...");
  await prisma.$executeRaw`TRUNCATE TABLE "_InternalRelationToVersion" RESTART IDENTITY CASCADE`;

  console.log("Truncating table _ExternalRelationToVersion...");
  await prisma.$executeRaw`TRUNCATE TABLE "_ExternalRelationToVersion" RESTART IDENTITY CASCADE`;

  console.log("Truncating table _ResourceToVersion...");
  await prisma.$executeRaw`TRUNCATE TABLE "_ResourceToVersion" RESTART IDENTITY CASCADE`;

  console.log("Truncating table StagingInternalRelation...");
  await prisma.$executeRaw`TRUNCATE TABLE "StagingInternalRelation" RESTART IDENTITY CASCADE`;

  console.log("Truncating table _StagingInternalRelationToVersion...");
  await prisma.$executeRaw`TRUNCATE TABLE "_StagingInternalRelationToVersion" RESTART IDENTITY CASCADE`;

  console.log("Truncating table Analytics...");
  await prisma.$executeRaw`TRUNCATE TABLE "Analytics" RESTART IDENTITY CASCADE`;

  console.log("Truncating table Notification...");
  await prisma.$executeRaw`TRUNCATE TABLE "Notification" RESTART IDENTITY CASCADE`;
};

const main = async () => {
  await truncateTables();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
