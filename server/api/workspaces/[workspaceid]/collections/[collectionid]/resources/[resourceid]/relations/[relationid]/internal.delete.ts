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

  // Check if the relation exists
  const relation = await prisma.stagingInternalRelation.findUnique({
    where: { id: relationid },
  });

  if (!relation) {
    throw createError({
      message: "Relation not found",
      statusCode: 404,
    });
  }

  // todo: remove mirror on publish

  // const relationType = relation.type;
  // const mirrorRelationType = mirrorRelation(relationType);

  // if (mirrorRelationType && !relation.mirror) {
  // Only the original relation should delete the mirror relation
  //   const mirroredRelation = await prisma.internalRelation.findFirst({
  //     where: {
  //       mirror: true,
  //       target_id: relation.source_id,
  //       type: mirrorRelationType,
  //     },
  //   });

  //   if (mirroredRelation) {
  // found mirror relation, delete it
  //     await prisma.internalRelation.delete({
  //       where: { id: mirroredRelation.id },
  //     });
  //   }
  // }

  // Delete the relation
  if (relation.action === "create") {
    await prisma.stagingInternalRelation.delete({
      where: { id: relationid },
    });
  } else {
    await prisma.stagingInternalRelation.update({
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
