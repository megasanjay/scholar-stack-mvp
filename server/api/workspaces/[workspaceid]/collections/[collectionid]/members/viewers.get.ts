import collectionExists from "~/server/utils/collection/collectionExists";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  await collectionExists(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  // Get the workspace members who are not admins or owners of the workspace
  const workspaceMembers = await prisma.workspaceMember.findMany({
    select: {
      user: {
        select: { emailAddress: true, familyName: true, givenName: true },
      },
      userId: true,
    },
    where: {
      admin: false,
      owner: false,
      workspaceId: workspaceid,
    },
  });

  const collectionAcessTeamUserIds = await prisma.collectionAccess.findMany({
    select: { userId: true },
    where: { collectionId, role: { in: ["admin", "editor"] } },
  });

  // remove workspace members who are already collection admins or editors
  const viewers = workspaceMembers.filter(
    (member) =>
      !collectionAcessTeamUserIds.some(
        (collectionMember) => collectionMember.userId === member.userId,
      ),
  );

  return viewers.map((viewer) => ({
    email_address: viewer.user.emailAddress,
    label: `${viewer.user.givenName} ${viewer.user.familyName}`,
    value: viewer.userId,
  }));
});
