export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const { workspaceid } = event.context.params as { workspaceid: string };

  const members = await prisma.workspaceMember.findMany({
    include: { user: true },
    where: { workspaceId: workspaceid },
  });

  const invitedMembers = await prisma.invite.findMany({
    where: { workspaceId: workspaceid },
  });

  return {
    invitedMembers: invitedMembers.map((member) => ({
      id: member.emailAddress,
      created: member.created.toISOString(),
    })),
    members: members.map((member) => ({
      id: member.user.id,
      name: `${member.user.givenName} ${member.user.familyName}`,
      admin: member.admin,
      created: member.created.toISOString(),
      emailAddress: member.user.emailAddress,
      owner: member.owner,
    })),
  };
});
