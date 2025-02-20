import collectionMinViewerPermission from "~/server/utils/collection/collectionMinViewerPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await collectionMinViewerPermission(event);

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

  // get the latest version of the collection
  const version = await prisma.version.findMany({
    orderBy: { created: "desc" },
    take: 1,
    where: { collectionId },
  });

  return {
    version:
      version.length > 0
        ? {
            id: version[0].id,
            name: version[0].name,
            changelog: version[0].changelog,
            created: version[0].created,
            published: version[0].published,
            publishedOn: version[0].publishedOn,
            updated: version[0].updated,
          }
        : null,
  };
});
