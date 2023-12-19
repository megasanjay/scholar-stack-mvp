import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const truncateTables = async () => {
  console.log("Truncating tables...");

  console.log("Truncating table Access...");
  await prisma.$executeRaw`TRUNCATE TABLE "Access" RESTART IDENTITY CASCADE`;

  console.log("Truncating table Invite...");
  await prisma.$executeRaw`TRUNCATE TABLE "Invite" RESTART IDENTITY CASCADE`;

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

  console.log("Truncating table _InternalRelationToVersion...");
  await prisma.$executeRaw`TRUNCATE TABLE "_InternalRelationToVersion" RESTART IDENTITY CASCADE`;

  console.log("Truncating table _ExternalRelationToVersion...");
  await prisma.$executeRaw`TRUNCATE TABLE "_ExternalRelationToVersion" RESTART IDENTITY CASCADE`;

  console.log("Truncating table _ResourceToVersion...");
  await prisma.$executeRaw`TRUNCATE TABLE "_ResourceToVersion" RESTART IDENTITY CASCADE`;

  console.log("Truncating table StagingInternalRelation...");
  await prisma.$executeRaw`TRUNCATE TABLE "StagingInternalRelation" RESTART IDENTITY CASCADE`;

  console.log("Truncating table StagingExternalRelation...");
  await prisma.$executeRaw`TRUNCATE TABLE "StagingExternalRelation" RESTART IDENTITY CASCADE`;

  console.log("Truncating table StagingResource...");
  await prisma.$executeRaw`TRUNCATE TABLE "StagingResource" RESTART IDENTITY CASCADE`;

  console.log("Truncating table _StagingInternalRelationToVersion...");
  await prisma.$executeRaw`TRUNCATE TABLE "_StagingInternalRelationToVersion" RESTART IDENTITY CASCADE`;

  console.log("Truncating table _StagingExternalRelationToVersion...");
  await prisma.$executeRaw`TRUNCATE TABLE "_StagingExternalRelationToVersion" RESTART IDENTITY CASCADE`;

  console.log("Truncating table _StagingResourceToVersion...");
  await prisma.$executeRaw`TRUNCATE TABLE "_StagingResourceToVersion" RESTART IDENTITY CASCADE`;

  console.log("Truncating table Analytics...");
  await prisma.$executeRaw`TRUNCATE TABLE "Analytics" RESTART IDENTITY CASCADE`;

  console.log("Truncating table Notification...");
  await prisma.$executeRaw`TRUNCATE TABLE "Notification" RESTART IDENTITY CASCADE`;
};

await truncateTables();

process.exit(0);
