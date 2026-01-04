export default defineEventHandler(async (event) => {
  await requireUserSession(event);

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
      // get the latest version of the collection
      Version: {
        select: {
          collectionTitle: true,
          collectionDescription: true,
        },
        orderBy: { created: "desc" },
        take: 1,
      },
    },
    orderBy: {
      updated: "desc",
    },
    where: {
      CollectionAccess: {
        some: {
          hidden: true,
        },
      },
      workspaceId: workspaceid,
    },
  });

  return collections || [];
});
