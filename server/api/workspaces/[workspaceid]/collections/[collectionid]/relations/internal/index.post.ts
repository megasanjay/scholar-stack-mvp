import { z } from "zod";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

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

  const collection = await prisma.collection.findUnique({
    where: { id: collectionid, workspace_id: workspaceid },
  });

  if (!collection) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  // get the latest draft version of the collection.
  const version = await prisma.version.findFirst({
    orderBy: { created: "desc" },
    take: 1,
    where: { collection_id: collectionid, published: false },
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
      Version: {
        some: {
          id: version.id,
        },
      },
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
      Version: {
        some: {
          collection_id: collectionid,
        },
      },
    },
  });

  if (!targetResource) {
    throw createError({
      message: "Target resource not found",
      statusCode: 404,
    });
  }

  if (sourceResource.original_resource_id === target) {
    throw createError({
      message: "Cannot create a cyclic relation",
      statusCode: 400,
    });
  }

  const internalRelation = await prisma.internalRelation.create({
    data: {
      action: "create",
      resource_type: resourceType,
      source_id: source,
      target_id: target,
      type,
      Version: {
        connect: {
          id: version.id,
        },
      },
    },
  });

  if (!internalRelation) {
    throw createError({
      message: "Failed to create the relation",
      statusCode: 500,
    });
  }

  const responseObject: GroupedRelation = {
    id: internalRelation.id,
    action: "create",
    created: internalRelation.created,
    external: false,
    resource_type: internalRelation.resource_type,
    source_id: source,
    source_name: sourceResource.title,
    target: internalRelation.target_id,
    target_name: targetResource.title,
    target_type: null,
    type: internalRelation.type,
    updated: internalRelation.updated,
  };

  return {
    data: responseObject,
    message: "Relation created",
    statusCode: 201,
  };
});
