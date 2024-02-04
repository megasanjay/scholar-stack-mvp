export default defineEventHandler(async (event) => {
  await protectRoute(event);

  await collectionExists(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const workspaceMembers = await prisma.workspaceMember.findMany({
    where: { admin: false, workspace_id: workspaceid },
  });

  const collectionAcessTeamUserIds = await prisma.collectionAccess.findMany({
    select: { user_id: true },
    where: { collection_id: collectionid, role: { in: ["admin", "editor"] } },
  });

  // remove workspace members who are already collection admins or editors

  const collectionAcessTeam = workspaceMembers.filter(
    (member) =>
      !collectionAcessTeamUserIds.some(
        (collectionMember) => collectionMember.user_id === member.user_id,
      ),
  );

  return collectionAcessTeam;
});
