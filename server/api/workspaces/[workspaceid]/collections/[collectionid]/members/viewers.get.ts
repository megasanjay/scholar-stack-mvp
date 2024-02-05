export default defineEventHandler(async (event) => {
  await protectRoute(event);

  await collectionExists(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  // Get the workspace members who are not admins or owners of the workspace
  const workspaceMembers = await prisma.workspaceMember.findMany({
    select: {
      user: {
        select: { username: true, name: true, email_address: true },
      },
      user_id: true,
    },
    where: {
      admin: false,
      owner: false,
      workspace_id: workspaceid,
    },
  });

  const collectionAcessTeamUserIds = await prisma.collectionAccess.findMany({
    select: { user_id: true },
    where: { collection_id: collectionid, role: { in: ["admin", "editor"] } },
  });

  // remove workspace members who are already collection admins or editors
  const viewers = workspaceMembers.filter(
    (member) =>
      !collectionAcessTeamUserIds.some(
        (collectionMember) => collectionMember.user_id === member.user_id,
      ),
  );

  return viewers.map((viewer) => ({
    email_address: viewer.user.email_address,
    label: viewer.user.name || viewer.user.username,
    value: viewer.user_id,
  }));
});
