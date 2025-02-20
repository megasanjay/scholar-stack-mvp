import { z } from "zod";
import { nanoid } from "nanoid";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);

  const { user } = session;
  const userId = user.id;

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

  // Check if the user already has a personal workspace
  if (parsedBody.data.personal) {
    const personalWorkspace = await prisma.workspace.findFirst({
      where: {
        personal: true,
        WorkspaceMember: {
          some: {
            userId,
          },
        },
      },
    });

    if (personalWorkspace) {
      throw createError({
        statusCode: 400,
        statusMessage: "You already have a personal workspace",
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
          userId,
        },
      },
    },
  });

  if (!workspace) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create workspace",
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
