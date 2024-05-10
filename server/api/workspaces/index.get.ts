import { nanoid } from "nanoid";
import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const user = await serverSupabaseUser(event);
  const userid = user?.id as string;

  const workspaceId = nanoid();

  return await prisma.$transaction(async (tx) => {
    // Get the user's workspaces

    const workspaces = await tx.workspaceMember.findMany({
      select: {
        workspace: {
          select: {
            id: true,
            title: true,
            created: true,
            description: true,
            personal: true,
            type: true,
          },
        },
      },
      where: {
        user_id: user?.id,
      },
    });

    // Check if a personal workspace already exists
    const personalWorkspaceExists = workspaces.some(
      (workspace) => workspace.workspace.personal,
    );

    if (workspaces && workspaces.length > 0 && personalWorkspaceExists) {
      const foundWorkspaces = workspaces.map(
        (workspace) => workspace.workspace,
      );

      // Move the personal workspace to the top
      const personalWorkspace = foundWorkspaces.find(
        (workspace) => workspace.personal,
      );

      if (personalWorkspace) {
        const personalWorkspaceIndex =
          foundWorkspaces.indexOf(personalWorkspace);
        foundWorkspaces.splice(personalWorkspaceIndex, 1);
        foundWorkspaces.unshift(personalWorkspace);
      }

      return foundWorkspaces;
    }

    // Create a personal workspace
    const personalWorkspace = await tx.workspace.create({
      data: {
        id: workspaceId,
        title: "My workspace",
        description: "This is my personal workspace",
        personal: true,
        type: "personal",
        WorkspaceMember: {
          create: {
            admin: false,
            owner: true,
            user_id: userid,
          },
        },
      },
    });

    return [personalWorkspace];
  });
});
