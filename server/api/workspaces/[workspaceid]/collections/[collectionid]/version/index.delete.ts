import collectionMinAdminPermission from "~/server/utils/collection/collectionMinAdminPermission";
import collectionNewVersion from "~/server/utils/collection/collectionNewVersion";

export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await collectionMinAdminPermission(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId, workspaceId: workspaceid },
  });

  if (!collection) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  const draftVersion = await prisma.version.findFirst({
    include: {
      Resource: true,
    },
    where: {
      collectionId,
      published: false,
    },
  });

  if (!draftVersion) {
    throw createError({
      message: "Draft version not found",
      statusCode: 404,
    });
  }

  const resources = draftVersion.Resource;

  // remove all resources from the draft version
  for (const resource of resources) {
    await prisma.resource.delete({
      where: { id: resource.id },
    });
  }

  // delete the draft version
  await prisma.version.delete({
    where: { id: draftVersion.id },
  });

  const { statusCode } = await collectionNewVersion(collectionId);

  if (statusCode !== 201) {
    throw createError({
      message: "Failed to create collection version",
      statusCode: 500,
    });
  }

  return {
    message: "Draft version deleted",
    statusCode: 200,
  };
});
