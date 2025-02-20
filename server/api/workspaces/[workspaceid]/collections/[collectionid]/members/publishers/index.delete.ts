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
      collectionId,
      userId: userid,
    },
  });

  if (!collectionRoleRecord) {
    await prisma.collectionAccess.create({
      data: {
        collectionId,
        role: "editor",
        userId: userid,
      },
    });
  } else {
    await prisma.collectionAccess.update({
      data: {
        role: "editor",
      },
      where: {
        userId_collectionId: {
          collectionId,
          userId: userid,
        },
      },
    });
  }

  return {
    message: "User removed from the collection publisher role",
    statusCode: 201,
  };
});
