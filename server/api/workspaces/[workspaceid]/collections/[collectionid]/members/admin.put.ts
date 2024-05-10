import { z } from "zod";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  await collectionMinAdminPermission(event);

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

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const { userid } = parsedBody.data;

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

  // Check if the user is a workspace admin or owner
  if (workspaceMember.admin || workspaceMember.owner) {
    throw createError({
      message:
        "The user has admin or owner permissions for the workspace. They already have admin access to all collections in the workspace",
      statusCode: 400,
    });
  }

  // Check if the user already has editor permissions for the collection
  const existingMember = await prisma.collectionAccess.findFirst({
    where: {
      collection_id: collectionid,
      role: "editor",
      user_id: userid,
    },
  });

  if (!existingMember) {
    throw createError({
      message:
        "The user does not have editor permissions for the collection. Only editors can be promoted to admin",
      statusCode: 400,
    });
  }

  // Update the user's role to admin/
  // Using updateMany since update can't handle non unique conditions
  const adminAccess = await prisma.collectionAccess.updateMany({
    data: {
      role: "admin",
    },
    where: {
      collection_id: collectionid,
      user_id: userid,
    },
  });

  // todo: might need to fail gracefully for different conditions here
  if (!adminAccess || adminAccess.count === 0 || adminAccess.count > 1) {
    throw createError({
      message: "Failed to provide admin privileges to the user",
      statusCode: 500,
    });
  }

  // get user details
  const user = await prisma.user.findFirst({
    select: {
      id: true,
      username: true,
      name: true,
      email_address: true,
    },
    where: {
      id: userid,
    },
  });

  const addedAdmin = {
    ...user,
    ...adminAccess,
  };

  return {
    admin: addedAdmin,
    statusCode: 201,
  };
});
