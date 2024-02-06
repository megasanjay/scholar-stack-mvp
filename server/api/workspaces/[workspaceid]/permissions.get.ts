import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  await workspaceExists(event);

  const user = await serverSupabaseUser(event);

  const { workspaceid } = event.context.params as {
    workspaceid: string;
  };

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { user_id: user?.id, workspace_id: workspaceid },
  });

  if (!workspaceMember) {
    throw createError({
      message: "Not a member of this workspace",
      statusCode: 403,
    });
  }

  if (workspaceMember.admin) {
    return { permission: "admin", statusCode: 200 };
  } else if (workspaceMember.owner) {
    return { permission: "owner", statusCode: 200 };
  } else {
    return { permission: "viewer", statusCode: 200 };
  }
});
