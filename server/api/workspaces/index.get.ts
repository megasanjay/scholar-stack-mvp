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

    if (workspaces && workspaces.length > 0) {
      return workspaces.map((workspace) => workspace.workspace);
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
