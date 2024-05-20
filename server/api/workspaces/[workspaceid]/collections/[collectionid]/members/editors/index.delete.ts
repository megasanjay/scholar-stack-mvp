import { z } from "zod";
import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const loggedInUser = await serverSupabaseUser(event);
  const loggedInUserId = loggedInUser?.id as string;

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

  const { userid } = parsedBody.data;

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  if (userid === loggedInUserId) {
    // The user is trying to remove themselves from the collection

    // Check if the user is a workspace admin
    const workspaceAdmin = await prisma.workspaceMember.findFirst({
      where: {
        admin: true,
        user_id: userid,
        workspace_id: workspaceid,
      },
    });

    const workspaceOwner = await prisma.workspaceMember.findFirst({
      where: {
        owner: true,
        user_id: userid,
        workspace_id: workspaceid,
      },
    });

    if (workspaceAdmin || workspaceOwner) {
      throw createError({
        message: "You cannot remove yourself from the collection",
        statusCode: 400,
      });
    }
  } else {
    await collectionMinAdminPermission(event);
  }

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

  // Get the collection access record for the user
  const collectionRoleRecord = await prisma.collectionAccess.findFirst({
    where: {
      collection_id: collectionid,
      user_id: userid,
    },
  });

  if (!collectionRoleRecord) {
    throw createError({
      message: "The user is not a member of the collection",
      statusCode: 400,
    });
  } else {
    await prisma.collectionAccess.delete({
      where: {
        user_id_collection_id: {
          collection_id: collectionid,
          user_id: userid,
        },
      },
    });

    // await prisma.collectionAccess.update({
    //   data: {
    //     role: "viewer",
    //   },
    //   where: {
    //     user_id_collection_id: {
    //       collection_id: collectionid,
    //       user_id: userid,
    //     },
    //   },
    // });
  }

  return {
    message: "User removed from the collection editor role",
    statusCode: 201,
  };
});
