/**
 * Delete a collection
 * TODO: DELETE THIS ENDPOINT
 */

import workspaceMinOwnerPermission from "~/server/utils/workspace/workspaceMinOwnerPermission";

export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await workspaceMinOwnerPermission(event);

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

  // todo: should this even be allowed?

  const deletedCollection = await prisma.collection.delete({
    where: { id: collectionId },
  });

  if (!deletedCollection) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  return {
    message: "Collection deleted",
    statusCode: 200,
  };
});
