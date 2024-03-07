import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  await collectionExists(event);

  const user = await serverSupabaseUser(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collectionAccess = await prisma.collectionAccess.findFirst({
    where: { collection_id: collectionid, user_id: user?.id },
  });

  if (!collectionAccess) {
    throw createError({
      message: "No access to collection",
      statusCode: 403,
    });
  }

  // collection admins
  if (collectionAccess?.role === "admin") {
    return { permission: "admin", statusCode: 200 };
  }

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { user_id: user?.id, workspace_id: workspaceid },
  });

  if (!workspaceMember) {
    throw createError({
      message: "No access to workspace",
      statusCode: 403,
    });
  }

  // collection admins
  if (workspaceMember?.admin || workspaceMember?.owner) {
    return { permission: "admin", statusCode: 200 };
  }

  // collection editors
  if (collectionAccess?.role === "editor") {
    return { permission: "editor", statusCode: 200 };
  }

  // collection viewer by default
  return { permission: "viewer", statusCode: 200 };
});
