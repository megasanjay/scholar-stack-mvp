export default defineEventHandler(async (event) => {
  await protectRoute(event);

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
  if (!relation.original_relation_id) {
    throw createError({
      message: "Relation is not a clone",
      statusCode: 404,
    });
  }

  // Get the original relation information
  const originalRelation = await prisma.externalRelation.findUnique({
    where: { id: relation.original_relation_id },
  });

  if (!originalRelation) {
    throw createError({
      message: "Original relation not found",
      statusCode: 404,
    });
  }

  let updatedAction = "";

  if (
    originalRelation.resource_type === relation.resource_type &&
    originalRelation.type === relation.type
  ) {
    await prisma.externalRelation.update({
      data: {
        action: "clone",
      },
      where: { id: relationid },
    });

    updatedAction = "clone";
  } else {
    await prisma.externalRelation.update({
      data: {
        action: "update",
      },
      where: { id: relationid },
    });

    updatedAction = "update";
  }

  await touchCollection(collectionid);

  return {
    message: "Relation updated",
    statusCode: 200,
    updatedAction,
  };
});
