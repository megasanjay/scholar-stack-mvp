export default defineEventHandler(async (event) => {
  await protectRoute(event);

  await collectionExists(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  /**
   * todo: the admin read order is backwards here. The workspace admin should be checked first, then the collection admin, then the collection editor. Can do later.
   */
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
    } else {
      const record = collectionAcessTeam.find(
        (member) => member.id === workspaceAdmin.user_id,
      );

      if (record) {
        record.role = "workspace-admin";
      }
    }
  }

  const workspaceOwner = await prisma.workspaceMember.findFirst({
    include: { user: true },
    where: { owner: true, workspace_id: workspaceid },
  });

  if (
    !collectionAcessTeam.some((member) => member.id === workspaceOwner?.user_id)
  ) {
    collectionAcessTeam.push({
      id: workspaceOwner?.user_id,
      username: workspaceOwner?.user.username,
      name: workspaceOwner?.user.name,
      created: workspaceOwner?.created.toISOString(),
      emailAddress: workspaceOwner?.user.email_address,
      role: "workspace-owner",
    });
  } else {
    const record = collectionAcessTeam.find(
      (member) => member.id === workspaceOwner?.user_id,
    );

    if (record) {
      record.role = "workspace-owner";
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
