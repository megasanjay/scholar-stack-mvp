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

  // Check if the user is a workspace owner or admin
  if (workspaceMember.owner || workspaceMember.admin) {
    throw createError({
      message:
        "This user is a workspace owner or admin and cannot be removed from the collection publisher role",
      statusCode: 400,
    });
  }

  // Get the collection access record for the user
  const collectionRoleRecord = await prisma.collectionAccess.findFirst({
    where: {
      collection_id: collectionid,
      user_id: userid,
    },
  });

  if (!collectionRoleRecord) {
    await prisma.collectionAccess.create({
      data: {
        collection_id: collectionid,
        role: "editor",
        user_id: userid,
      },
    });
  } else {
    await prisma.collectionAccess.update({
      data: {
        role: "editor",
      },
      where: {
        user_id_collection_id: {
          collection_id: collectionid,
          user_id: userid,
        },
      },
    });
  }

  return {
    message: "User removed from the collection publisher role",
    statusCode: 201,
  };
});
