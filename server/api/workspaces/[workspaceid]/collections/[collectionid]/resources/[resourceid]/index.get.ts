export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await collectionMinViewerPermission(event);

  const { collectionid, resourceid, workspaceid } = event.context.params as {
    collectionid: string;
    resourceid: string;
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

  // get the latest version of the collection
  const version = await prisma.version.findFirst({
    orderBy: { created: "desc" },
    take: 1,
    where: { collection_id: collectionid },
  });

  if (!version) {
    throw createError({
      message: "No version found",
      statusCode: 404,
    });
  }

  let resource;

  if (version.published) {
    resource = await prisma.resource.findUnique({
      where: {
        id: resourceid,
        Version: {
          some: {
            collection_id: collectionid,
          },
        },
      },
    });
  } else {
    // Check if the resource is part of the collection version
    resource = await prisma.resource.findUnique({
      where: {
        id: resourceid,
        Version: {
          some: {
            collection_id: collectionid,
          },
        },
      },
    });
  }

  if (!resource) {
    throw createError({
      message: "Resource not found",
      statusCode: 404,
    });
  }

  return {
    ...resource,
    type: resource.type || null,
  };
});
