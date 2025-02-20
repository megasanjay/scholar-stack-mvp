import collectionMinViewerPermission from "~/server/utils/collection/collectionMinViewerPermission";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  await collectionMinViewerPermission(event);

  /**
   * TODO: It maybe that the hide has to be done on the workspace level.
   * We shall revisit this later
   */

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId: workspaceid,
    },
  });

  if (!workspaceMember) {
    throw createError({
      message: "The user is not a member of the workspace",
      statusCode: 400,
    });
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId, workspaceId: workspaceid },
  });

  if (!collection) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  const collectionAccessEntry = await prisma.collectionAccess.findFirst({
    where: { collectionId, userId },
  });

  if (!collectionAccessEntry) {
    // create a new collection access entry with the
  }

  const collectionAccessGetTransaction = prisma.collectionAccess.findFirst({
    where: { collectionId, userId },
  });

  const collectionAccessUpdateTransaction = prisma.collectionAccess.update({
    data: { hidden: true },
    where: {
      userId_collectionId: {
        collectionId,
        userId,
      },
    },
  });

  await prisma.$transaction([
    collectionAccessGetTransaction,
    collectionAccessUpdateTransaction,
  ]);

  return {
    message: "Collection hidden",
    statusCode: 200,
  };
});
