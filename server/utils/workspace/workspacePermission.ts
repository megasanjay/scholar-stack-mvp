/**
 * Create a new unpublished draft version of a collection
 * @param collectionid - The id of the collection to create a new version for
 */
const workspacePermission = async (workspaceid: string, userid: string) => {
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: { user_id: userid, workspace_id: workspaceid },
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
};

export default workspacePermission;
