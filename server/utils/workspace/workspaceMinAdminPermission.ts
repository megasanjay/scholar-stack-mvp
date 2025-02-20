import prisma from "~/server/utils/prisma";
import workspaceExists from "~/server/utils/workspace/workspaceExists";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id as string;

  // Check if the workspace exists
  const workspaceid = await workspaceExists(event);

  // Check access table for the workspace
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId: workspaceid,
    },
  });

  // Check if the user is a member of the workspace
  if (!workspaceMember) {
    throw createError({
      message: "Unauthorized",
      statusCode: 401,
    });
  }

  // Check if the user has at least admin permisison
  if (workspaceMember.admin === false && workspaceMember.owner === false) {
    throw createError({
      message: "Unauthorized",
      statusCode: 401,
    });
  }

  return true;
});
