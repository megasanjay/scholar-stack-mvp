/**
 * Create a new unpublished draft version of a collection
 * @param collectionid - The id of the collection to create a new version for
 */
const workspacePermission = async (workspaceId: string, userId: string) => {
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
  });

  if (!workspaceMember) {
    throw createError({
      statusCode: 403,
      statusMessage: "Not a member of this workspace",
    });
  }

  if (workspaceMember.admin) {
    return { permission: "admin", statusCode: 200 };
  } else if (workspaceMember.owner) {
    return { permission: "owner", statusCode: 200 };
  } else {
    return { permission: "viewer", statusCode: 200 };
  }
};

export default workspacePermission;
