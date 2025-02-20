import { z } from "zod";
import collectionMinEditorPermission from "~/server/utils/collection/collectionMinEditorPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const bodySchema = z
    .object({
      resourceType: z.string(),
      source: z.string(),
      target: z.string(),
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

  const { resourceType, source, target, type } = parsedBody.data;

  /**
   * TODO: Check if we are using the correct source (with respect to versions)
   */

  if (target === source) {
    throw createError({
      message: "Cannot create a relation to itself",
      statusCode: 400,
    });
  }

  // Check if the resource exists in the collection and is part of the draft version
  const sourceResource = await prisma.resource.findFirst({
    where: {
      id: source,
      versionId: version.id,
    },
  });

  if (!sourceResource) {
    throw createError({
      message: "Source resource not found",
      statusCode: 404,
    });
  }

  // Check if the source resource is deleted or is an old version
  if (
    !sourceResource.action ||
    sourceResource.action === "delete" ||
    sourceResource.action === "oldVersion"
  ) {
    throw createError({
      message: "Source resource cannot accept relations",
      statusCode: 400,
    });
  }

  // Check if the target resource exists and is part of the collection
  const targetResource = await prisma.resource.findFirst({
    where: {
      id: target,
      versionId: version.id,
    },
  });

  if (!targetResource) {
    throw createError({
      message: "Target resource not found",
      statusCode: 404,
    });
  }

  if (sourceResource.originalResourceId === target) {
    throw createError({
      message: "Cannot create a cyclic relation",
      statusCode: 400,
    });
  }

  const internalRelation = await prisma.internalRelation.create({
    data: {
      action: "create",
      resourceType,
      sourceId: source,
      targetId: target,
      type,
      versionId: version.id,
    },
  });

  if (!internalRelation) {
    throw createError({
      message: "Failed to create the relation",
      statusCode: 500,
    });
  }

  const responseObject: AllRelationsItem = {
    id: internalRelation.id,
    action: "create",
    external: false,
    originalRelationId: internalRelation.originalRelationId,
    resourceType: internalRelation.resourceType,
    source: sourceResource.id,
    sourceName: sourceResource.title,
    sourceOriginalId: sourceResource.originalResourceId,
    target: internalRelation.targetId,
    targetName: targetResource.title,
    targetType: null,
    type: internalRelation.type,
  };

  return {
    data: responseObject,
    message: "Relation created",
    statusCode: 201,
  };
});
