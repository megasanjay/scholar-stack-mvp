import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const userid = user?.id as string;

  const { workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  // Check if the collection exists in the workspace
  const collectionid = await collectionExists(event);

  // Having access to the workspace is enough to view the collection
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      user_id: userid,
      workspace_id: workspaceid,
    },
  });

  if (workspaceMember) {
    return true;
  }

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
    collectionAccess?.role !== "editor" &&
    collectionAccess?.role !== "viewer"
  ) {
    throw createError({
      message: "Unauthorized",
      statusCode: 401,
    });
  }
});
