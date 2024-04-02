export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const { workspaceid } = event.context.params as { workspaceid: string };

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceid },
  });

  if (!workspace) {
    throw createError({
      message: "Workspace not found",
      statusCode: 404,
    });
  }

  const collections = await prisma.collection.findMany({
    include: {
      Versions: {
        orderBy: { created: "desc" },
        take: 1,
      },
    },
    orderBy: {
      updated: "desc",
    },
    where: { hidden: false, workspace_id: workspaceid },
  });

  const responseWorkspace: APIResponseWorkspace = {
    id: workspace.id,
    title: workspace.title,
    collections: collections.map((collection) => ({
      id: collection.id,
      title: collection.title,
      created: collection.created.toISOString(),
      description: collection.description,
      detailedDescription: collection.detailed_description,
      identifier: collection.identifier,
      image_url: collection.image_url,
      updated: collection.updated.toISOString(),
      version: collection.Versions[0]
        ? {
            id: collection.Versions[0].id,
            name: collection.Versions[0].name,
            changelog: collection.Versions[0].changelog,
            collection_id: collection.Versions[0].collection_id,
            created: collection.Versions[0].created.toISOString(),
            identifier: collection.Versions[0].identifier,
            published: collection.Versions[0].published,
            published_on: collection.Versions[0].published_on
              ? collection.Versions[0].published_on.toISOString()
              : "",
            updated: collection.Versions[0].updated.toISOString(),
          }
        : null,
    })),
    description: workspace.description,
    personal: workspace.personal,
  };

  return responseWorkspace;
});
