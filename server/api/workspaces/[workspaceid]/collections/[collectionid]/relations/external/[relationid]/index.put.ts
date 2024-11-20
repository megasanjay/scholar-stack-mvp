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
    throw createError({
      message: "The provided parameters are invalid",
      statusCode: 400,
    });
  }

  await collectionMinEditorPermission(event);

  const { collectionid, relationid, workspaceid } = event.context.params as {
    collectionid: string;
    relationid: string;
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

  // Check if the relation is part of the draft version
  const relation = await prisma.externalRelation.findFirst({
    where: {
      id: relationid,
      Version: {
        some: {
          published: false,
        },
      },
    },
  });

  if (!relation) {
    throw createError({
      message: "Relations can only be edited in the draft version",
      statusCode: 404,
    });
  }

  // Check if the relation has the 'deleted' action
  if (relation.action !== "delete") {
    throw createError({
      message:
        "Relation is marked for deletion. Restore the relation to edit it",
      statusCode: 400,
    });
  }

  const { resourceType, target, targetType, type } = parsedBody.data;

  if (relation.original_relation_id) {
    // This would mean the relation is a clone
    // Only update the resource type and relation type

    const originalRelation = await prisma.externalRelation.findUnique({
      where: { id: relation.original_relation_id },
    });

    if (!originalRelation) {
      throw createError({
        message: "Original relation not found",
        statusCode: 404,
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
    // This would mean the relation is a new relation
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

  if (!updatedRelation) {
    throw createError({
      message: "Something went wrong",
      statusCode: 404,
    });
  }

  const sourceResource = await prisma.resource.findUnique({
    where: { id: updatedRelation?.source_id },
  });

  return {
    data: {
      id: relationid,
      action: updatedRelation!.action || null,
      created: updatedRelation!.created,
      external: true,
      original_relation_id: updatedRelation!.original_relation_id || null,
      resource_type: updatedRelation!.resource_type,
      source: updatedRelation!.source_id,
      source_name: sourceResource?.title || "",
      source_original_id: sourceResource?.original_resource_id || "",
      target: updatedRelation!.target,
      target_type: updatedRelation!.target_type,
      type: updatedRelation!.type,
      updated: updatedRelation!.updated,
    },
    message: "Relation updated",
    statusCode: 200,
  };
});
