import collectionExists from "~/server/utils/collection/collectionExists";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  await collectionExists(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  const collectionAccess = await prisma.collectionAccess.findFirst({
    where: { collectionId, userId },
  });

  if (!collectionAccess) {
    throw createError({
      statusCode: 403,
      statusMessage: "No access to collection",
    });
  }

  // collection admins
  if (collectionAccess?.role === "admin") {
    return { permission: "admin", statusCode: 200 };
  }

  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId: workspaceid },
  });

  if (!workspaceMember) {
    throw createError({
      statusCode: 403,
      statusMessage: "No access to workspace",
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
