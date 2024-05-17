import { z } from "zod";
import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const loggedInUser = await serverSupabaseUser(event);
  const loggedInUserId = loggedInUser?.id as string;

  const bodySchema = z
    .object({
      userid: z.string().min(1),
    })
    .strict();

  const body = await readBody(event);

  // Check if the body is present
  if (!body) {
    throw createError({
      message: "Missing required fields",
      statusCode: 400,
    });
  }

  // Check if the body is valid
  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    console.log(parsedBody.error);

    throw createError({
      message: "The provided parameters are invalid",
      statusCode: 400,
    });
  }

  const { userid } = parsedBody.data;

  const { workspaceid } = event.context.params as { workspaceid: string };

  if (userid === loggedInUserId) {
    // The user is trying to remove themselves from the workspace

    const workspaceOwner = await prisma.workspaceMember.findFirst({
      where: {
        owner: true,
        user_id: userid,
        workspace_id: workspaceid,
      },
    });

    if (workspaceOwner) {
      throw createError({
        message: "You cannot remove yourself from the workspace",
        statusCode: 400,
      });
    }
  } else {
    await workspaceMinAdminPermission(event);
  }

  /**
   * Check if the workspace is a personal workspace
   * If it is, throw an error
   */
  const personalWorkspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceid,
      personal: true,
    },
  });

  if (personalWorkspace) {
    throw createError({
      message: "You cannot remove members from a personal workspace",
      statusCode: 400,
    });
  }

  // Check if the user is a workspace owner
  const workspaceOwner = await prisma.workspaceMember.findFirst({
    where: {
      owner: true,
      user_id: userid,
      workspace_id: workspaceid,
    },
  });

  if (workspaceOwner) {
    throw createError({
      message: "You cannot remove the workspace owner",
      statusCode: 400,
    });
  }

  // Check if the user is a member of the workspace
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      user_id: userid,
      workspace_id: workspaceid,
    },
  });

  if (!workspaceMember) {
    throw createError({
      message: "The user is not a member of the workspace",
      statusCode: 400,
    });
  }

  // Delete the workspace member
  await prisma.workspaceMember.deleteMany({
    where: {
      user_id: userid,
      workspace_id: workspaceid,
    },
  });

  return {
    message: "User removed from workspace",
    statusCode: 200,
  };
});
