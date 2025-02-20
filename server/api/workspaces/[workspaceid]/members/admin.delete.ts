import { z } from "zod";
import workspaceMinOwnerPermission from "~/server/utils/workspace/workspaceMinOwnerPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

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

  await workspaceMinOwnerPermission(event);

  const { userid } = parsedBody.data;

  const { workspaceid } = event.context.params as { workspaceid: string };

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
      userId: userid,
      workspaceId: workspaceid,
    },
  });

  if (workspaceOwner) {
    throw createError({
      message: "You cannot make changes to the owner of the workspace",
      statusCode: 400,
    });
  }

  // Check if the user is a member of the workspace
  const workspaceMember = await prisma.workspaceMember.findFirst({
    where: {
      userId: userid,
      workspaceId: workspaceid,
    },
  });

  if (!workspaceMember) {
    throw createError({
      message: "The user is not a member of the workspace",
      statusCode: 400,
    });
  }

  // Check if the user is a workspace admin
  const workspaceAdmin = await prisma.workspaceMember.findFirst({
    where: {
      admin: true,
      userId: userid,
      workspaceId: workspaceid,
    },
  });

  if (!workspaceAdmin) {
    throw createError({
      message: "The user is not an admin of the workspace",
      statusCode: 400,
    });
  }

  // Remove the admin permission from the user
  await prisma.workspaceMember.update({
    data: {
      admin: false,
    },
    where: {
      userId_workspaceId: {
        userId: userid,
        workspaceId: workspaceid,
      },
    },
  });

  return {
    message: "Admin permission removed from the user",
    statusCode: 200,
  };
});
