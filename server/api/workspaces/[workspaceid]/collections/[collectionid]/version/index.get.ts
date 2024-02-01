export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await collectionMinViewerPermission(event);

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

  // get the latest version of the collection
  const version = await prisma.version.findMany({
    orderBy: { created: "desc" },
    take: 1,
    where: { collection_id: collectionid },
  });

  return {
    version:
      version.length > 0
        ? {
            id: version[0].id,
            name: version[0].name,
            changelog: version[0].changelog,
            created: version[0].created,
            identifier: version[0].identifier,
            published: version[0].published,
            published_on: version[0].published_on,
            updated: version[0].updated,
          }
        : null,
  };
});
