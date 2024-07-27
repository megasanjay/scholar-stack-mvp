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
  // Delete the relation

  if (!relation.original_relation_id) {
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
    statusCode: 204,
  };
});
