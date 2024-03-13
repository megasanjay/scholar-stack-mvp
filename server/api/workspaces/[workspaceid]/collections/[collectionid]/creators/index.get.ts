export default defineEventHandler(async (event) => {
  await protectRoute(event);

  await collectionExists(event);

  await collectionMinViewerPermission(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collectionCreators = await prisma.collection.findUnique({
    select: {
      creators: true,
    },
    where: { id: collectionid, workspace_id: workspaceid },
  });

  if (!collectionCreators) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  return collectionCreators;
});
