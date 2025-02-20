import prisma from "~/server/utils/prisma";
import collectionExists from "~/server/utils/collection/collectionExists";
import workspacePermission from "~/server/utils/workspace/workspacePermission";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  // Check if the collection exists in the workspace
  const collectionId = await collectionExists(event);

  const { workspaceid } = event.context.params as {
    workspaceid: string;
  };

  // workspace admins also have collection admin permission by default
  const { permission } = await workspacePermission(workspaceid, userId);

  if (permission === "admin" || permission === "owner") {
    return {
      admin: true,
      type: "workspace",
    };
  }

  // Check access table for the workspace
  const collectionAccess = await prisma.collectionAccess.findFirst({
    where: {
      collectionId,
      userId,
    },
  });

  // Check if the user has at least admin permisison
  if (collectionAccess?.role !== "admin") {
    throw createError({
      message: "Unauthorized",
      statusCode: 401,
    });
  }

  return {
    admin: true,
    type: "collection",
  };
});
