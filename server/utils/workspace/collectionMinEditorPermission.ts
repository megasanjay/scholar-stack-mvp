import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const userid = user?.id as string;

  // Check if the collection exists in the workspace
  const collectionid = await collectionExists(event);

  // Check access table for the workspace
  const collectionAccess = await prisma.collectionAccess.findFirst({
    where: {
      collection_id: collectionid,
      user_id: userid,
    },
  });

  // Check if the user has at least admin permisison
  if (
    collectionAccess?.role !== "admin" &&
    collectionAccess?.role !== "editor"
  ) {
    throw createError({
      message: "Unauthorized",
      statusCode: 401,
    });
  }

  return true;
});
