export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await collectionMinViewerPermission(event);

  const { collectionid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  /**
   * TODO: split this into three queries
   */
  const collection = await prisma.collection.findUnique({
    where: { id: collectionid },
  });

  if (!collection) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  // get the latest version of the collection
  const version = await prisma.version.findMany({
    include: {
      Resources: true,
    },
    orderBy: { created: "desc" },
    take: 1,
    where: { collection_id: collectionid },
  });

  const resources = version.length > 0 ? version[0].Resources : [];

  return {
    id: collection.id,
    title: collection.title,
    created: collection.created,
    description: collection.description,
    detailedDescription: collection.detailed_description,
    identifier: collection.identifier,
    image_url: collection.image_url,
    private: collection.private,
    resources,
    updated: collection.updated,
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
