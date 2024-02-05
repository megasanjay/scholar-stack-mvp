import prisma from "~/server/utils/prisma";
import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const userid = user?.id as string;

  // Check if the workspace exists
  const workspaceid = await workspaceExists(event);

  // Check access table for the workspace
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      user_id: userid,
      workspace_id: workspaceid,
    },
  });

  // Check if the user is a member of the workspace
  if (!workspaceMember) {
    throw createError({
      message: "Unauthorized",
      statusCode: 401,
    });
  }

  // Check if the user has at least owner permisison
  if (workspaceMember.owner === false) {
    throw createError({
      message: "Unauthorized",
      statusCode: 401,
    });
  }

  return true;
});
