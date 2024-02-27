import { z } from "zod";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const bodySchema = z
    .object({
      resourceType: z.string(),
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

  const { resourceType, target, targetType, type } = parsedBody.data;

  const externalRelation = await prisma.externalRelation.create({
    data: {
      action: "create",
      resource_type: resourceType,
      source_id: resourceid,
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
