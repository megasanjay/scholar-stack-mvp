import collectionMinViewerPermission from "~/server/utils/collection/collectionMinViewerPermission";
import validateCollectionDraftVersion from "~/server/utils/collection/validateCollectionDraftVersion";

export default defineEventHandler(async (event) => {
  await protectRoute(event);
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

  const validationResults = await validateCollectionDraftVersion(event);

  return {
    errors: validationResults.errors || [],
    statusCode: 200,
    valid: validationResults.valid || false,
  };
});
