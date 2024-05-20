import { nanoid } from "nanoid";
import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const user = await serverSupabaseUser(event);
  const userid = user?.id as string;

  const userDetails = await prisma.user.findUnique({
    where: {
      id: userid,
    },
  });

  if (!userDetails) {
    throw createError({
      message: "User not found",
      status: 404,
    });
  }

  const workspaces = await prisma.workspaceMember.findMany({
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
      user_id: userid,
    },
  });

  // Check if a personal workspace already exists
  const personalWorkspaceExists = workspaces.some(
    (workspace) => workspace.workspace.personal,
  );

  const workspaceId = nanoid();

  if (!personalWorkspaceExists) {
    await prisma.workspace.create({
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
  }

  return userDetails;
});
