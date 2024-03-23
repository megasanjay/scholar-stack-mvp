import { z } from "zod";

export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await collectionMinAdminPermission(event);

  const bodySchema = z
    .object({
      title: z.string().min(1),
      description: z.string().max(350),
      detailedDescription: z.string().max(5000),
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

  const collection = await prisma.collection.findUnique({
    where: { id: collectionid, workspace_id: workspaceid },
  });

  if (!collection) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  const { title, description, detailedDescription } = parsedBody.data;

  const updatedCollection = await prisma.collection.update({
    data: {
      title,
      description,
      detailed_description: detailedDescription,
    },
    where: { id: collectionid },
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
