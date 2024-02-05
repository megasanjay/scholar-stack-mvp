import { z } from "zod";
import { nanoid } from "nanoid";

import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const bodySchema = z
    .object({
      title: z.string().min(1),
      description: z.string(),
      personal: z.boolean().optional(),
      type: z
        .union([z.literal("personal"), z.literal("organization")])
        .optional(),
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

  const user = await serverSupabaseUser(event);
  const userid = user?.id as string;

  // Check if the user already has a personal workspace
  if (parsedBody.data.personal) {
    const personalWorkspace = await prisma.workspace.findFirst({
      where: {
        personal: true,
        WorkspaceMember: {
          some: {
            user_id: userid,
          },
        },
      },
    });

    if (personalWorkspace) {
      throw createError({
        message: "You already have a personal workspace",
        statusCode: 400,
      });
    }
  }

  const workspaceId = nanoid();

  const workspace = await prisma.workspace.create({
    data: {
      id: workspaceId,
      title: parsedBody.data.title,
      description: parsedBody.data.description,
      personal: parsedBody.data.personal || false,
      type: parsedBody.data.type || "organization",
      WorkspaceMember: {
        create: {
          admin: false,
          owner: true,
          user_id: userid,
        },
      },
    },
  });

  if (!workspace) {
    throw createError({
      message: "Failed to create workspace",
      statusCode: 500,
    });
  }

  return {
    statusCode: 201,
    workspace: {
      id: workspace.id,
      title: workspace.title,
      created: workspace.created,
      description: workspace.description,
      personal: workspace.personal,
      updated: workspace.updated,
    },
  };
});
