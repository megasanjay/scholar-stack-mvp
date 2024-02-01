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

  const validationResults = await validateCollectionDraftVersion(event);

  return {
    errors: validationResults.errors || [],
    statusCode: 200,
    valid: validationResults.valid || false,
  };
});
