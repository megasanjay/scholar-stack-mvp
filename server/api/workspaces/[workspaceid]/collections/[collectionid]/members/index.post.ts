import { z } from "zod";
import isEmail from "validator/lib/isEmail";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const bodySchema = z
    .object({
      user: z.string().min(1),
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
      message: "You cannot invite members to a personal workspace",
      statusCode: 400,
    });
  }

  const { user } = parsedBody.data;

  // check if the user exists as username or email
  const userExists = await prisma.user.findFirst({
    where: {
      OR: [{ username: user }, { email_address: user }],
    },
  });

  if (!userExists) {
    // check if user is an email address
    const isemail = isEmail(user);

    if (!isemail) {
      throw createError({
        message: "The provided user does not exist",
        statusCode: 400,
      });
    }

    // check if the user is already invited
    const isInvited = await prisma.invite.findFirst({
      where: {
        email_address: user,
        workspace_id: workspaceid,
      },
    });

    if (isInvited) {
      throw createError({
        message: "The user is already invited",
        statusCode: 400,
      });
    }

    // Create an invite for the user
    await prisma.invite.create({
      data: {
        email_address: user,
        workspace_id: workspaceid,
      },
    });

    return {
      message: "User invited",
      statusCode: 200,
    };
  }

  // check if the user is already a member
  const isMember = await prisma.workspaceMember.findFirst({
    where: {
      user_id: userExists.id,
      workspace_id: workspaceid,
    },
  });

  if (isMember) {
    throw createError({
      message: "The user is already a member",
      statusCode: 400,
    });
  }

  // Create a new member
  await prisma.workspaceMember.create({
    data: {
      admin: false,
      user_id: userExists.id,
      workspace_id: workspaceid,
    },
  });

  return {
    message: "User added",
    statusCode: 200,
  };
});
