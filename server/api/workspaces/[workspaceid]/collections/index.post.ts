import { z } from "zod";
import { nanoid } from "nanoid";
import collectionNewVersion from "~/server/utils/collection/collectionNewVersion";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

  const bodySchema = z
    .object({
      title: z.string().min(1),
      description: z.string().max(350),
      type: z.string(),
    })
    .strict();

  const body = await readBody(event);

  // Check if the body is present
  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required fields",
    });
  }

  // Check if the body is valid
  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    console.log(parsedBody.error);

    throw createError({
      statusCode: 400,
      statusMessage: "The provided parameters are invalid",
    });
  }

  const { workspaceid } = event.context.params as { workspaceid: string };

  const { title, description, type } = parsedBody.data;

  const collection = await prisma.collection.create({
    data: {
      title,
      CollectionAccess: {
        create: {
          role: "admin",
          userId,
        },
      },
      description,
      imageUrl: `https://api.dicebear.com/6.x/shapes/svg?seed=${nanoid()}`,
      type,
      workspaceId: workspaceid,
    },
  });

  if (!collection) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create collection",
    });
  }

  // Get the workspace owner and admins and add them to the collection access table with the role of admin
  // const workspaceUsers = await prisma.workspaceMember.findMany({
  //   where: { workspace_id: workspaceid },
  // });

  // for (const workspaceUser of workspaceUsers) {
  //   if (workspaceUser.owner || workspaceUser.admin) {
  //     // Check if the user is already in the collection access table
  //     const collectionAccess = await prisma.collectionAccess.findFirst({
  //       where: {
  //         collection_id: collection.id,
  //         user_id: workspaceUser.user_id,
  //       },
  //     });

  //     if (collectionAccess) {
  //       continue;
  //     }

  //     await prisma.collectionAccess.create({
  //       data: {
  //         collection_id: collection.id,
  //         role: "admin",
  //         user_id: workspaceUser.user_id,
  //       },
  //     });
  //   }
  // }

  const collectionid = collection.id;

  const { statusCode } = await collectionNewVersion(collectionid);

  if (statusCode !== 201) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create collection version",
    });
  }

  return {
    collectionId: collection.id,
    statusCode: 201,
  };
});
