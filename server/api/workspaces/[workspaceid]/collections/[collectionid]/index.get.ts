import collectionMinViewerPermission from "~/server/utils/collection/collectionMinViewerPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  await collectionMinViewerPermission(event);

  const { collectionid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  /**
   * TODO: split this into three queries
   */
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection) {
    throw createError({
      statusCode: 404,
      statusMessage: "Collection not found",
    });
  }

  // get the latest version of the collection
  const version = await prisma.version.findMany({
    include: {
      Resource: true,
    },
    orderBy: { created: "desc" },
    take: 1,
    where: { collectionId },
  });

  const resources = version.length > 0 ? version[0].Resource : [];

  return {
    id: collection.id,
    title: collection.title,
    created: collection.created,
    description: collection.description,
    detailedDescription: collection.detailedDescription,
    imageUrl: collection.imageUrl,
    private: collection.private,
    resources,
    type: collection.type,
    updated: collection.updated,
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
