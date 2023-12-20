export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await workspaceMinAdminPermission(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collection = await prisma.collection.findUnique({
    where: { id: collectionid, workspace_id: workspaceid },
  });

  if (!collection) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  const draftVersion = await prisma.version.findFirst({
    include: {
      StagingResources: true,
    },
    where: {
      collection_id: collectionid,

      published: false,
    },
  });

  if (!draftVersion) {
    throw createError({
      message: "Draft version not found",
      statusCode: 404,
    });
  }

  const resources = draftVersion.StagingResources;

  // remove all resources from the draft version
  for (const resource of resources) {
    await prisma.stagingResource.delete({
      where: { id: resource.id },
    });
  }

  // delete the draft version
  await prisma.version.delete({
    where: { id: draftVersion.id },
  });

  return {
    message: "Draft version deleted",
    statusCode: 200,
  };
});
