export default defineEventHandler(async (event) => {
  await protectRoute(event);

  await collectionExists(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collectionAcessTeam = [];

  const collectionAdmins = await prisma.collectionAccess.findMany({
    include: { user: true },
    where: { collection_id: collectionid, role: "admin" },
  });

  for (const collectionAdmin of collectionAdmins) {
    collectionAcessTeam.push({
      id: collectionAdmin.user_id,
      username: collectionAdmin.user.username,
      name: collectionAdmin.user.name,
      created: collectionAdmin.created.toISOString(),
      emailAddress: collectionAdmin.user.email_address,
      role: "collection-admin",
    });
  }

  const workspaceAdmins = await prisma.workspaceMember.findMany({
    include: { user: true },
    where: { admin: true, workspace_id: workspaceid },
  });

  for (const workspaceAdmin of workspaceAdmins) {
    if (
      !collectionAcessTeam.some(
        (member) => member.id === workspaceAdmin.user_id,
      )
    ) {
      collectionAcessTeam.push({
        id: workspaceAdmin.user_id,
        username: workspaceAdmin.user.username,
        name: workspaceAdmin.user.name,
        created: workspaceAdmin.created.toISOString(),
        emailAddress: workspaceAdmin.user.email_address,
        role: "workspace-admin",
      });
    }
  }

  const collectionEditors = await prisma.collectionAccess.findMany({
    include: { user: true },
    where: { collection_id: collectionid, role: "editor" },
  });

  for (const collectionEditor of collectionEditors) {
    if (
      !collectionAcessTeam.some(
        (member) => member.id === collectionEditor.user_id,
      )
    ) {
      collectionAcessTeam.push({
        id: collectionEditor.user_id,
        username: collectionEditor.user.username,
        name: collectionEditor.user.name,
        created: collectionEditor.created.toISOString(),
        emailAddress: collectionEditor.user.email_address,
        role: "collection-editor",
      });
    }
  }

  return collectionAcessTeam;
});
