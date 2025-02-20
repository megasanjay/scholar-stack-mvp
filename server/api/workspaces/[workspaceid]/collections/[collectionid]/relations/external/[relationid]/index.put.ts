import { z } from "zod";
import collectionMinEditorPermission from "~/server/utils/collection/collectionMinEditorPermission";
import touchCollection from "~/server/utils/collection/touchCollection";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

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

  // Check if the relation is part of the draft version
  const relation = await prisma.externalRelation.findFirst({
    where: {
      id: relationid,
      versionId: version.id,
    },
  });

  if (!relation) {
    throw createError({
      message: "Relations can only be edited in the draft version",
      statusCode: 404,
    });
  }

  // Check if the relation has the 'deleted' action
  if (relation.action === "delete") {
    throw createError({
      message:
        "Relation is marked for deletion. Restore the relation to edit it",
      statusCode: 400,
    });
  }

  const { resourceType, target, targetType, type } = parsedBody.data;

  if (relation.originalRelationId) {
    // This would mean that this is a clone or an update
    // Only update the resource type and relation type

    const originalRelation = await prisma.externalRelation.findUnique({
      where: { id: relation.originalRelationId },
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
      originalRelation.resourceType !== resourceType ||
      originalRelation.type !== type
    ) {
      await prisma.externalRelation.update({
        data: {
          action: "update",
          resourceType,
          type,
        },
        where: { id: relationid },
      });
    } else {
      await prisma.externalRelation.update({
        data: {
          action: "clone",
          resourceType,
          type,
        },
        where: { id: relationid },
      });
    }
  } else {
    // This would mean the relation is a new relation
    await prisma.externalRelation.update({
      data: {
        resourceType,
        target,
        targetType,
        type,
      },
      where: { id: relationid },
    });
  }

  await touchCollection(collectionId);

  // Get the updated relation to return to the frontend
  const updatedRelation = await prisma.externalRelation.findUnique({
    include: {
      source: true,
    },
    where: { id: relationid },
  });

  if (!updatedRelation) {
    throw createError({
      message: "Something went wrong",
      statusCode: 404,
    });
  }

  return {
    data: {
      id: relationid,
      action: updatedRelation!.action || null,
      created: updatedRelation!.created,
      external: true,
      originalRelationId: updatedRelation!.originalRelationId || null,
      resourceType: updatedRelation!.resourceType,
      source: updatedRelation!.sourceId,
      sourceName: updatedRelation.source?.title || "",
      sourceOriginalId: updatedRelation.source?.originalResourceId || "",
      target: updatedRelation!.target,
      targetType: updatedRelation!.targetType,
      type: updatedRelation!.type,
      updated: updatedRelation!.updated,
    },
    message: "Relation updated",
    statusCode: 200,
  };
});
