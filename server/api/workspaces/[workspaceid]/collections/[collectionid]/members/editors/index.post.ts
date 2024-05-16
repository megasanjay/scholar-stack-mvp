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
        "The user has admin or owner permissions for the workspace. They already have edit access to all collections in the workspace",
      statusCode: 400,
    });
  }

  // Check if the user is already has editor or admin permissions for the collection
  const existingMember = await prisma.collectionAccess.findFirst({
    where: {
      collection_id: collectionid,
      user_id: userid,
    },
  });

  if (existingMember) {
    throw createError({
      message:
        "The user already has editor or admin permissions for the collection",
      statusCode: 400,
    });
  }

  // Create a new collection access record
  const editorAccess = await prisma.collectionAccess.create({
    data: {
      collection_id: collectionid,
      role: "editor",
      user_id: userid,
    },
  });

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

  const addedEditor = {
    ...user,
    ...editorAccess,
  };

  return {
    editor: addedEditor,
    statusCode: 201,
  };
});
