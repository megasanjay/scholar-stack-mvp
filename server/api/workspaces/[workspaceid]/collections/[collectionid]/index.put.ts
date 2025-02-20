import { z } from "zod";
import collectionMinAdminPermission from "~/server/utils/collection/collectionMinAdminPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await collectionMinAdminPermission(event);

  const bodySchema = z
    .object({
      title: z.string().min(1),
      description: z.string().max(350),
      detailedDescription: z.string().max(5000),
      type: z.string(),
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

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId, workspaceId: workspaceid },
  });

  if (!collection) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  const { title, description, detailedDescription, type } = parsedBody.data;

  const updatedCollection = await prisma.collection.update({
    data: {
      title,
      description,
      detailedDescription,
      type,
    },
    where: { id: collectionId },
  });

  if (!updatedCollection) {
    throw createError({
      message: "Something went wrong",
      statusCode: 404,
    });
  }

  return {
    message: "Collection updated",
    statusCode: 200,
  };
});
