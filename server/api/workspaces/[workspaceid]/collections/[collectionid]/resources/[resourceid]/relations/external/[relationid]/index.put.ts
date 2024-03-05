import { z } from "zod";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const bodySchema = z
    .object({
      id: z.string().optional(),
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
    throw createError({
      message: "The provided parameters are invalid",
      statusCode: 400,
    });
  }

  await collectionMinEditorPermission(event);

  const { collectionid, relationid, resourceid, workspaceid } = event.context
    .params as {
    collectionid: string;
    relationid: string;
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

  // Check if the resource exists and is part of the draft version of the collection
  const resource = await prisma.resource.findUnique({
    where: {
      id: resourceid,
      Version: { some: { collection_id: collectionid, published: false } },
    },
  });

  if (!resource) {
    throw createError({
      message: "Resource not found",
      statusCode: 404,
    });
  }

  // Check if the relation exists and is part of the resource
  const currentRelation = await prisma.externalRelation.findUnique({
    where: { id: relationid, source_id: resourceid },
  });

  if (!currentRelation) {
    throw createError({
      message: "Relation not found",
      statusCode: 404,
    });
  }

  const { resourceType, target, targetType, type } = parsedBody.data;

  // Get the original relation information
  if (currentRelation.original_relation_id) {
    const originalRelation = await prisma.externalRelation.findUnique({
      where: { id: currentRelation.original_relation_id },
    });

    if (!originalRelation) {
      throw createError({
        message: "Original relation not found",
        statusCode: 404,
      });
    }

    if (originalRelation.action === "delete") {
      throw createError({
        message:
          "Relation marked for deletion. Restore the relation to edit it",
        statusCode: 400,
      });
    }

    /**
     * * Check if the relation has changed
     * * If it has, add the update action
     * * If it hasn't, add the clone action
     */
    if (
      originalRelation.resource_type !== resourceType ||
      originalRelation.type !== type
    ) {
      await prisma.externalRelation.update({
        data: {
          action: "update",
          resource_type: resourceType,
          type,
        },
        where: { id: relationid },
      });
    } else {
      await prisma.externalRelation.update({
        data: {
          action: "clone",
          resource_type: resourceType,
          type,
        },
        where: { id: relationid },
      });
    }
  } else {
    await prisma.externalRelation.update({
      data: {
        resource_type: resourceType,
        target,
        target_type: targetType,
        type,
      },
      where: { id: relationid },
    });
  }

  await touchCollection(collectionid);

  // Get the updated relation to return to the frontend
  const updatedRelation = await prisma.externalRelation.findUnique({
    where: { id: relationid },
  });

  return {
    data: {
      id: updatedRelation?.id,
      action: updatedRelation?.action || null,
      created: updatedRelation?.created,
      external: true,
      original_relation_id: updatedRelation?.original_relation_id || null,
      resource_type: updatedRelation?.resource_type,
      target: updatedRelation?.target,
      target_type: updatedRelation?.target_type,
      type: updatedRelation?.type,
      updated: updatedRelation?.updated,
    },
    message: "Relation updated",
    statusCode: 200,
  };
});
