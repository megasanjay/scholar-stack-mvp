import collectionMinEditorPermission from "~/server/utils/collection/collectionMinEditorPermission";
import touchCollection from "~/server/utils/collection/touchCollection";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
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
  const relation = await prisma.internalRelation.findFirst({
    where: {
      id: relationid,
      versionId: version.id,
    },
  });

  if (!relation) {
    throw createError({
      message: "Relations can only be removed from draft version",
      statusCode: 404,
    });
  }

  // Check if the relation has the 'deleted' action
  if (relation.action !== "delete") {
    throw createError({
      message: "Relation is not deleted",
      statusCode: 400,
    });
  }

  // Check if the relation is a clone
  // Only clones can be restored to their original state
  if (!relation.originalRelationId) {
    throw createError({
      message: "Relation is not a clone",
      statusCode: 404,
    });
  }

  // Get the original relation information
  const originalRelation = await prisma.internalRelation.findUnique({
    where: { id: relation.originalRelationId },
  });

  if (!originalRelation) {
    throw createError({
      message: "Original relation not found",
      statusCode: 404,
    });
  }

  let updatedAction = "";

  if (
    originalRelation.resourceType === relation.resourceType &&
    originalRelation.type === relation.type
  ) {
    await prisma.internalRelation.update({
      data: {
        action: "clone",
      },
      where: { id: relationid },
    });

    updatedAction = "clone";
  } else {
    await prisma.internalRelation.update({
      data: {
        action: "update",
      },
      where: { id: relationid },
    });

    updatedAction = "update";
  }

  await touchCollection(collectionId);

  return {
    message: "Relation updated",
    statusCode: 200,
    updatedAction,
  };
});
