export default defineEventHandler(async (event) => {
  await protectRoute(event);

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
  const currentRelation = await prisma.internalRelation.findUnique({
    where: { id: relationid, source_id: resourceid },
  });

  if (!currentRelation) {
    throw createError({
      message: "Relation not found",
      statusCode: 404,
    });
  }

  // Check if the relation has the 'deleted' action
  if (currentRelation.action !== "delete") {
    throw createError({
      message: "Relation is not deleted",
      statusCode: 400,
    });
  }

  // Check if the relation is a clone
  // Only clones can be restored to their original state
  if (!currentRelation.original_relation_id) {
    throw createError({
      message: "Relation is not a clone",
      statusCode: 404,
    });
  }

  // Get the original relation information
  const originalRelation = await prisma.internalRelation.findUnique({
    where: { id: currentRelation.original_relation_id },
  });

  if (!originalRelation) {
    throw createError({
      message: "Original relation not found",
      statusCode: 404,
    });
  }

  let updatedAction = "";

  if (
    originalRelation.resource_type === currentRelation.resource_type &&
    originalRelation.type === currentRelation.type
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

  await touchCollection(collectionid);

  return {
    message: "Relation updated",
    statusCode: 200,
    updatedAction,
  };
});
