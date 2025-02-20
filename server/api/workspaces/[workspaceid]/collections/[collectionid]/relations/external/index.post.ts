import { z } from "zod";
import collectionMinEditorPermission from "~/server/utils/collection/collectionMinEditorPermission";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const bodySchema = z
    .object({
      resourceType: z.string(),
      source: z.string(),
      target: z.string(),
      targetType: z.string(),
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

  // get the latest draft version of the collection.
  const version = await prisma.version.findFirst({
    where: { collectionId, published: false },
  });

  if (!version) {
    throw createError({
      message: "No draft version found",
      statusCode: 404,
    });
  }

  const { resourceType, source, target, targetType, type } = parsedBody.data;

  // Check if the resource exists in the collection and is part of the draft version
  const resource = await prisma.resource.findFirst({
    where: {
      id: source,
      versionId: version.id,
    },
  });

  if (!resource) {
    throw createError({
      message: "Resource not found",
      statusCode: 404,
    });
  }

  // Check if the source resource is deleted or is an old version
  if (
    !resource.action ||
    resource.action === "delete" ||
    resource.action === "oldVersion"
  ) {
    throw createError({
      message: "Source resource cannot accept relations",
      statusCode: 400,
    });
  }

  const externalRelation = await prisma.externalRelation.create({
    data: {
      action: "create",
      resourceType,
      sourceId: source,
      target,
      targetType,
      type,
      versionId: version.id,
    },
  });

  if (!externalRelation) {
    throw createError({
      message: "Failed to create the relation",
      statusCode: 500,
    });
  }

  const responseObject: AllRelationsItem = {
    id: externalRelation.id,
    action: "create",
    external: true,
    originalRelationId: externalRelation.originalRelationId,
    resourceType: externalRelation.resourceType,
    source: resource.id,
    sourceName: resource.title,
    sourceOriginalId: resource.originalResourceId,
    target: externalRelation.target,
    targetType: externalRelation.targetType,
    type: externalRelation.type,
  };

  return {
    data: responseObject,
    message: "Relation created",
    statusCode: 201,
  };
});
