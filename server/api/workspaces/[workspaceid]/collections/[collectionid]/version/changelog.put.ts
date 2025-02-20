import { z } from "zod";
import collectionMinEditorPermission from "~/server/utils/collection/collectionMinEditorPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession;

  const bodySchema = z
    .object({
      changelog: z.string().min(1),
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

  await collectionMinEditorPermission(event);

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

  const { changelog } = parsedBody.data;

  const latestVersion = await prisma.version.findFirst({
    orderBy: { created: "desc" },
    where: { collectionId },
  });

  if (!latestVersion) {
    throw createError({
      message: "No version found",
      statusCode: 404,
    });
  }

  if (latestVersion.published) {
    throw createError({
      message: "Cannot edit a published version",
      statusCode: 400,
    });
  }

  const updatedVersion = await prisma.version.update({
    data: {
      changelog,
    },
    where: { id: latestVersion.id },
  });

  if (!updatedVersion) {
    throw createError({
      message: "Something went wrong",
      statusCode: 404,
    });
  }

  return {
    message: "Version updated",
    statusCode: 200,
  };
});
