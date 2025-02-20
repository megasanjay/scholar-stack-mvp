import collectionExists from "~/server/utils/collection/collectionExists";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  await collectionExists(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  /**
   * todo: the admin read order is backwards here. The workspace admin should be checked first, then the collection admin, then the collection editor. Can do later.
   */
  const collectionAcessTeam = [];

  const collectionAdmins = await prisma.collectionAccess.findMany({
    include: { user: true },
    where: { collectionId, role: "admin" },
  });

  for (const collectionAdmin of collectionAdmins) {
    collectionAcessTeam.push({
      id: collectionAdmin.user.id,
      name: `${collectionAdmin.user.givenName} ${collectionAdmin.user.familyName}`,
      created: collectionAdmin.created.toISOString(),
      emailAddress: collectionAdmin.user.emailAddress,
      role: "collection-admin",
    });
  }

  const workspaceAdmins = await prisma.workspaceMember.findMany({
    include: { user: true },
    where: { admin: true, workspaceId: workspaceid },
  });

  for (const workspaceAdmin of workspaceAdmins) {
    if (
      !collectionAcessTeam.some(
        (member) => member.id === workspaceAdmin.user.id,
      )
    ) {
      collectionAcessTeam.push({
        id: workspaceAdmin.user.id,
        name: `${workspaceAdmin.user.givenName} ${workspaceAdmin.user.familyName}`,
        created: workspaceAdmin.created.toISOString(),
        emailAddress: workspaceAdmin.user.emailAddress,
        role: "workspace-admin",
      });
    } else {
      const record = collectionAcessTeam.find(
        (member) => member.id === workspaceAdmin.user.id,
      );

      if (record) {
        record.role = "workspace-admin";
      }
    }
  }

  const workspaceOwner = await prisma.workspaceMember.findFirst({
    include: { user: true },
    where: { owner: true, workspaceId: workspaceid },
  });

  if (
    !collectionAcessTeam.some((member) => member.id === workspaceOwner?.user.id)
  ) {
    collectionAcessTeam.push({
      id: workspaceOwner?.user.id,

      name: `${workspaceOwner?.user.givenName} ${workspaceOwner?.user.familyName}`,
      created: workspaceOwner?.created.toISOString(),
      emailAddress: workspaceOwner?.user.emailAddress,
      role: "workspace-owner",
    });
  } else {
    const record = collectionAcessTeam.find(
      (member) => member.id === workspaceOwner?.user.id,
    );

    if (record) {
      record.role = "workspace-owner";
    }
  }

  const collectionEditors = await prisma.collectionAccess.findMany({
    include: { user: true },
    where: { collectionId, role: "editor" },
  });

  for (const collectionEditor of collectionEditors) {
    if (
      !collectionAcessTeam.some(
        (member) => member.id === collectionEditor.user.id,
      )
    ) {
      collectionAcessTeam.push({
        id: collectionEditor.user.id,
        name: `${collectionEditor.user.givenName} ${collectionEditor.user.familyName}`,
        created: collectionEditor.created.toISOString(),
        emailAddress: collectionEditor.user.emailAddress,
        role: "collection-editor",
      });
    }
  }

  return collectionAcessTeam;
});
