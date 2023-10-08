import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const userid = user?.id as string;

  // Check if the workspace exists
  const workspaceid = await workspaceExists(event);

  // Check access table for the workspace
  const access = await prisma.access.findFirst({
    where: {
      user_id: userid,
      workspace_id: workspaceid,
    },
  });

  if (!access) {
    throw createError({
      message: "Unauthorized",
      statusCode: 401,
    });
  }

  // Check if the user is an owner of the workspace
  if (access.role !== "owner") {
    throw createError({
      message: "Unauthorized",
      statusCode: 401,
    });
  }
});