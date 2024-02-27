import { z } from "zod";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const bodySchema = z
    .object({
      resourceType: z.string(),
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

  const { collectionid, resourceid, workspaceid } = event.context.params as {
    collectionid: string;
    resourceid: string;
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

  // Check if the resource exists and is part of the draft version
  const resource = await prisma.resource.findFirst({
    where: { id: resourceid, Version: { some: { id: version.id } } },
  });

  if (!resource) {
    throw createError({
      message: "Resource not found",
      statusCode: 404,
    });
  }

  const { resourceType, target, type } = parsedBody.data;

  if (target === resourceid) {
    throw createError({
      message: "Cannot create a relation to itself",
      statusCode: 400,
    });
  }

  const internalRelation = await prisma.internalRelation.create({
    data: {
      action: "create",
      resource_type: resourceType,
      source_id: resourceid,
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
    target: internalRelation.target_id,
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
