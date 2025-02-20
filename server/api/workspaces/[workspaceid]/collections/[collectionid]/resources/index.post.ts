import { z } from "zod";
import collectionMinEditorPermission from "~/server/utils/collection/collectionMinEditorPermission";
import touchCollection from "~/server/utils/collection/touchCollection";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await collectionMinEditorPermission(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  const bodySchema = z
    .object({
      title: z.string().min(1),
      description: z.string().max(350),
      identifier: z.string().min(1),
      identifierType: z.string().min(1),
      resourceType: z.string().min(1),
      versionLabel: z.string().optional(),
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

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId, workspaceId: workspaceid },
  });

  if (!collection) {
    throw createError({
      statusCode: 404,
      statusMessage: "Collection not found",
    });
  }

  // get the latest version of the collection
  const version = await prisma.version.findFirst({
    where: { collectionId, published: false },
  });

  // if there is no version return an error
  if (!version) {
    throw createError({
      statusCode: 404,
      statusMessage: "No draft version found",
    });
  }

  const {
    title,
    description,
    identifier,
    identifierType,
    resourceType,
    versionLabel,
  } = parsedBody.data;

  // Add the resource to the collection version
  const resource = await prisma.resource.create({
    data: {
      title,
      action: "create",
      backLinkId: null,
      description,
      identifier,
      identifierType,
      resourceType,
      versionId: version.id,
      versionLabel: versionLabel || null,
    },
  });

  const addedToVersion = await prisma.version.update({
    data: {
      Resource: {
        connect: { id: resource.id },
      },
    },
    where: { id: version.id },
  });

  await touchCollection(collectionId);

  console.log(addedToVersion);

  return {
    resourceId: resource.id,
    statusCode: 201,
  };
});
