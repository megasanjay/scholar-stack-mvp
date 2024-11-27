import { nanoid } from "nanoid";
import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const user = await serverSupabaseUser(event);

  const userId = user?.id as string;
  const userEmail = user?.email as string;

  const userExists = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!userExists) {
    console.log("Creating user", userId, userEmail);

    const user = await prisma.user.create({
      data: {
        id: userId,
        username: userEmail, //

        name: "",
        affiliation: "",
        contact_email_address: "",
        email_address: userEmail,

        website: "",
      },
    });

    if (!user) {
      return {
        statusCode: 500,
      };
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
        user_id: userId,
      },
    });

    // Create a personal workspace for the user if it doesn't exist
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
              user_id: userId,
            },
          },
        },
      });
    }

    return {
      statusCode: 201,
    };
  }

  return {
    statusCode: 200,
  };
});
