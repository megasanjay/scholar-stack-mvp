export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  // Get the user's workspaces
  const workspaces = await kysely()
    .selectFrom("WorkspaceMember")
    .innerJoin("Workspace", "Workspace.id", "WorkspaceMember.workspaceId")
    .where("userId", "=", userId)
    .selectAll()
    .execute();

  // const workspaces = await prisma.workspaceMember.findMany({
  //   select: {
  //     workspace: {
  //       select: {
  //         id: true,
  //         title: true,
  //         created: true,
  //         description: true,
  //         personal: true,
  //         type: true,
  //       },
  //     },
  //   },
  //   where: {
  //     user_id: userid,
  //   },
  // });

  if (workspaces && workspaces.length > 0) {
    // const foundWorkspaces = workspaces.map((workspace) => workspace.workspace);
    const foundWorkspaces = workspaces.map((workspace) => workspace);

    // Move the personal workspace to the top
    const personalWorkspace = foundWorkspaces.find(
      (workspace) => workspace.personal,
    );

    if (personalWorkspace) {
      const personalWorkspaceIndex = foundWorkspaces.indexOf(personalWorkspace);

      foundWorkspaces.splice(personalWorkspaceIndex, 1);
      foundWorkspaces.unshift(personalWorkspace);
    }

    return foundWorkspaces || [];
  }

  return [];
});
