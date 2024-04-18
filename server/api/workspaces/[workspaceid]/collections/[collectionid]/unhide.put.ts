import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await collectionMinViewerPermission(event);

  const user = await serverSupabaseUser(event);

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

  const collectionAccessGetTransaction = prisma.collectionAccess.findFirst({
    where: { collection_id: collectionid, user_id: user?.id },
  });

  const collectionAccessUpdateTransaction = prisma.collectionAccess.update({
    data: { hidden: false },
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
    message: "Collection unhidden successfully",
    statusCode: 200,
  };
});
