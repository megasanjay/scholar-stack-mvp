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

  // Check if the resource exists
  const resource = await prisma.resource.findUnique({
    where: { id: resourceid },
  });

  if (!resource) {
    throw createError({
      message: "Resource not found",
      statusCode: 404,
    });
  }
  // check if the relation exists

  const relation = await prisma.externalRelation.findUnique({
    where: { id: relationid, source_id: resourceid },
  });

  // todo: check if the relation is part of the resource and the latest version

  if (!relation) {
    throw createError({
      message: "Relation not found",
      statusCode: 404,
    });
  }

  // get the original relation
  const originalRelation = await prisma.externalRelation.findUnique({
    where: { id: relation.original_relation_id },
  });

  // restore the relation
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
    updatedAction = "clone";
    await prisma.externalRelation.update({
      data: {
        action: "clone",
      },
      where: { id: relationid },
    });
  } else {
    updatedAction = "update";
    await prisma.externalRelation.update({
      data: {
        action: "update",
      },
      where: { id: relationid },
    });
  }

  await touchCollection(collectionid);

  return {
    message: "Relation restored",
    statusCode: 200,
    updatedAction,
  };
});
