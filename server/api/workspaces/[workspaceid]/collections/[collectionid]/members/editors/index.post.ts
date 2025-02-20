import { z } from "zod";
import collectionMinAdminPermission from "~/server/utils/collection/collectionMinAdminPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

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

  const collectionId = parseInt(collectionid);

  const { userid } = parsedBody.data;

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
      collectionId,
      userId: userid,
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
      collectionId,
      role: "editor",
      userId: userid,
    },
  });

  // get user details
  const user = await prisma.user.findFirst({
    select: {
      id: true,
      emailAddress: true,
      familyName: true,
      givenName: true,
    },
    where: {
      id: userid,
    },
  });

  if (!user) {
    throw createError({
      message: "User not found",
      statusCode: 404,
    });
  }

  const addedEditor = {
    ...user,
    name: `${user.givenName} ${user.familyName}`,
    ...editorAccess,
  };

  return {
    editor: addedEditor,
    statusCode: 201,
  };
});
