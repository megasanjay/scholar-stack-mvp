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
    where: {
      CollectionAccess: {
        every: {
          hidden: true,
        },
      },
      workspace_id: workspaceid,
    },
  });

  return collections;
});
