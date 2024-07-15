import { z } from "zod";

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
  const { resourceType, source, target, targetType, type } = parsedBody.data;

  // Check if the resource exists in the collection and is part of the draft version
  const resource = await prisma.resource.findFirst({
    where: {
      id: source,
      Version: {
        some: {
          id: version.id,
        },
      },
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
      resource_type: resourceType,
      source_id: source,
      target,
      target_type: targetType,
      type,
      Version: {
        connect: {
          id: version.id,
        },
      },
    },
  });

  if (!externalRelation) {
    throw createError({
      message: "Failed to create the relation",
      statusCode: 500,
    });
  }

  const responseObject: GroupedRelation = {
    id: externalRelation.id,
    action: "create",
    created: externalRelation.created,
    external: true,
    resource_type: externalRelation.resource_type,
    source_id: resource.id,
    source_name: resource.title,
    target: externalRelation.target,
    target_type: externalRelation.target_type,
    type: externalRelation.type,
    updated: externalRelation.updated,
  };

  return {
    data: responseObject,
    message: "Relation created",
    statusCode: 201,
  };
});
