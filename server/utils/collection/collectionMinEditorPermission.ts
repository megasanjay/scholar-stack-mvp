import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const userid = user?.id as string;

  // Check if the collection exists in the workspace
  const collectionid = await collectionExists(event);

  const { workspaceid } = event.context.params as {
    workspaceid: string;
  };

  // workspace admins also have collection admin permission by default
  const { permission } = await workspacePermission(
    workspaceid,
    user?.id as string,
  );

  if (permission === "admin" || permission === "owner") {
    return true;
  }

  // Check access table for the workspace
  const collectionAccess = await prisma.collectionAccess.findFirst({
    where: {
      collection_id: collectionid,
      user_id: userid,
    },
  });

  if (!collectionAccess) {
    throw createError({
      message: "Unauthorized - No collection access found",
      statusCode: 401,
    });
  }

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
