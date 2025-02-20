import prisma from "~/server/utils/prisma";
import workspaceExists from "~/server/utils/workspace/workspaceExists";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  // Check if the workspace exists
  const workspaceId = await workspaceExists(event);

  // Check access table for the workspace
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId,
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
