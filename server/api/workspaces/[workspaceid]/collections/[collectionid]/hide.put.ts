import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await collectionMinViewerPermission(event);

  /**
   * TODO: It maybe that the hide has to be done on the workspace level.
   * We shalle revisit this later
   */
  const user = await serverSupabaseUser(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      user_id: user?.id,
      workspace_id: workspaceid,
    },
  });

  if (!workspaceMember) {
    throw createError({
      message: "The user is not a member of the workspace",
      statusCode: 400,
    });
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionid, workspace_id: workspaceid },
  });

  if (!collection) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  const collectionAccessEntry = await prisma.collectionAccess.findFirst({
    where: { collection_id: collectionid, user_id: user?.id },
  });

  if (!collectionAccessEntry) {
    // create a new collection access entry with the
  }

  const collectionAccessGetTransaction = prisma.collectionAccess.findFirst({
    where: { collection_id: collectionid, user_id: user?.id },
  });

  const collectionAccessUpdateTransaction = prisma.collectionAccess.update({
    data: { hidden: true },
    where: {
      user_id_collection_id: {
        collection_id: collectionid,
        user_id: user?.id as string,
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
