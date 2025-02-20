import { z } from "zod";
import workspaceMinOwnerPermission from "~/server/utils/workspace/workspaceMinOwnerPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const bodySchema = z
    .object({
      title: z.string().min(1),
      description: z.string(),
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

  await workspaceMinOwnerPermission(event);

  const { workspaceid } = event.context.params as { workspaceid: string };

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceid },
  });

  if (!workspace) {
    throw createError({
      statusCode: 404,
      statusMessage: "Workspace not found",
    });
  }

  const { title, description } = parsedBody.data;

  const updatedWorkspace = await prisma.workspace.update({
    data: {
      title,
      description,
    },
    where: { id: workspaceid },
  });

  if (!updatedWorkspace) {
    throw createError({
      statusCode: 404,
      statusMessage: "Workspace not found",
    });
  }

  return {
    statusCode: 200,
    statusMessage: "Workspace updated",
  };
});
