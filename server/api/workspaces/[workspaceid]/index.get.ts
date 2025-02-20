export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { workspaceid } = event.context.params as { workspaceid: string };

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceid },
  });

  if (!workspace) {
    throw createError({
      statusCode: 404,
      statusMessage: "Workspace not found",
    });
  }

  const collections = await prisma.collection.findMany({
    include: {
      CollectionAccess: true,
      Version: {
        orderBy: { created: "desc" },
        take: 1,
      },
    },
    orderBy: {
      updated: "desc",
    },
    where: {
      workspaceId: workspaceid,
    },
  });

  // Remove collections that the user has hidden
  const visibleCollections = collections.filter((collection) => {
    const collectionAccess = collection.CollectionAccess.find(
      (access) => access.userId === userId,
    );

    return !collectionAccess?.hidden;
  });

  const hiddenCollections = collections.filter((collection) => {
    const collectionAccess = collection.CollectionAccess.find(
      (access) => access.userId === userId,
    );

    return collectionAccess?.hidden;
  });

  const responseWorkspace: APIResponseWorkspace = {
    id: workspace.id,
    title: workspace.title,
    collections: visibleCollections.map((collection) => ({
      id: collection.id,
      title: collection.title,
      created: collection.created.toISOString(),
      description: collection.description,
      detailedDescription: collection.detailedDescription,
      imageUrl: collection.imageUrl,
      updated: collection.updated.toISOString(),
      version: collection.Version[0]
        ? {
            id: collection.Version[0].id,
            name: collection.Version[0].name,
            changelog: collection.Version[0].changelog,
            collectionId: collection.Version[0].collectionId,
            created: collection.Version[0].created.toISOString(),
            published: collection.Version[0].published,
            publishedOn: collection.Version[0].publishedOn
              ? collection.Version[0].publishedOn.toISOString()
              : "",
            updated: collection.Version[0].updated.toISOString(),
          }
        : null,
    })),
    description: workspace.description,
    hiddenCollectionsCount: hiddenCollections.length || 0,
    personal: workspace.personal,
  };

  return responseWorkspace;
});
