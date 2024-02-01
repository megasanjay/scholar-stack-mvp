import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  // Check if the user is part of the workspace
  const user = await serverSupabaseUser(event);

  const userid = user?.id as string;

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      user_id: userid,
      workspace_id: workspaceid,
    },
  });

  if (!workspaceMember) {
    throw createError({
      message: "Unauthorized",
      statusCode: 401,
    });
  }

  // Check if the collection exists in the workspace
  const collection = await prisma.collection.findUnique({
    where: {
      id: collectionid,
      workspace_id: workspaceid,
    },
  });

  if (!collection) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  return collectionid;
});
