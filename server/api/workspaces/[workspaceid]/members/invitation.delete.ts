import { z } from "zod";
import workspaceMinAdminPermission from "~/server/utils/workspace/workspaceMinAdminPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const bodySchema = z
    .object({
      emailAddress: z.string().min(1),
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

  await workspaceMinAdminPermission(event);

  const { emailAddress } = parsedBody.data;

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

  // Check if the user is on the invited members list
  const invitedMember = await prisma.invite.findFirst({
    where: {
      emailAddress,
      workspaceId: workspaceid,
    },
  });

  if (!invitedMember) {
    throw createError({
      message: "The user is not on the invited members list",
      statusCode: 400,
    });
  }

  // Remove the user from the invited members list
  const deletedRecord = await prisma.invite.deleteMany({
    where: {
      emailAddress,
      workspaceId: workspaceid,
    },
  });

  if (!deletedRecord) {
    throw createError({
      message: "The user could not be removed from the invited members list",
      statusCode: 500,
    });
  }

  return {
    message: "The user has been removed from the invited members list",
    statusCode: 204,
  };
});
