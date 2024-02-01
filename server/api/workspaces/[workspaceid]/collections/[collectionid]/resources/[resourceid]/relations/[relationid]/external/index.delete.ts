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

  // Check if the resource is part of the draft version
  const draftResource = await prisma.resource.findFirst({
    where: {
      id: resourceid,
      Version: {
        some: {
          published: false,
        },
      },
    },
  });

  if (!draftResource) {
    throw createError({
      message: "Relations can only be removed from draft version",
      statusCode: 404,
    });
  }

  // Check if the relation is exists
  const relation = await prisma.externalRelation.findUnique({
    where: { id: relationid },
  });

  if (!relation) {
    throw createError({
      message: "Relation not found",
      statusCode: 404,
    });
  }

  // Delete the relation

  if (relation.action === "create") {
    await prisma.externalRelation.delete({
      where: { id: relationid },
    });
  } else {
    await prisma.externalRelation.update({
      data: {
        action: "delete",
      },
      where: { id: relationid },
    });
  }

  await touchCollection(collectionid);

  return {
    message: "Relation removed",
    statusCode: 200,
  };
});
