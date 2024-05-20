import { z } from "zod";
import { nanoid } from "nanoid";
import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const user = await serverSupabaseUser(event);
  const userid = user?.id as string;

  const bodySchema = z
    .object({
      title: z.string().min(1),
      description: z.string().max(350),
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

  const { workspaceid } = event.context.params as { workspaceid: string };

  const { title, description } = parsedBody.data;

  const collection = await prisma.collection.create({
    data: {
      title,
      CollectionAccess: {
        create: {
          role: "admin",
          user_id: userid,
        },
      },
      description,
      identifier: `c${nanoid(8)}`,
      image_url: `https://api.dicebear.com/6.x/shapes/svg?seed=${nanoid()}`,
      workspace_id: workspaceid,
    },
  });

  if (!collection) {
    throw createError({
      message: "Failed to create collection",
      statusCode: 500,
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
      message: "Failed to create collection version",
      statusCode: 500,
    });
  }

  return {
    collectionId: collection.id,
    statusCode: 201,
  };
});
