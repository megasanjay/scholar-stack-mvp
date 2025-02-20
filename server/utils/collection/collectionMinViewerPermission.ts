import collectionExists from "~/server/utils/collection/collectionExists";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const { workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  // Check if the collection exists in the workspace
  const collectionId = await collectionExists(event);

  // Having access to the workspace is enough to view the collection
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId: workspaceid,
    },
  });

  if (workspaceMember) {
    return true;
  }

  // Check access table for the workspace
  const collectionAccess = await prisma.collectionAccess.findFirst({
    where: {
      collectionId,
      userId,
    },
  });

  // Check if the user has at least admin permisison
  if (
    collectionAccess?.role !== "admin" &&
    collectionAccess?.role !== "editor" &&
    collectionAccess?.role !== "viewer"
  ) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }
});
