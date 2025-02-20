import collectionMinViewerPermission from "~/server/utils/collection/collectionMinViewerPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await collectionMinViewerPermission(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
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

  // get the draft version of the collection.
  const version = await prisma.version.findFirst({
    include: {
      ExternalRelation: {
        include: {
          source: true,
        },
      },
      InternalRelation: {
        include: {
          source: true,
          target: true,
        },
      },
    },
    where: { collectionId, published: false },
  });

  if (!version) {
    throw createError({
      message: "No version found",
      statusCode: 404,
    });
  }

  // get all the relations for the collection
  const internalRelations: AllRelationsItem[] = version.InternalRelation.map(
    (relation) => ({
      id: relation.id,
      action: relation.action || null,
      external: false,
      originalRelationId: relation.originalRelationId || null,
      resourceType: relation.resourceType,
      source: relation.sourceId,
      sourceName: relation.source.title,
      sourceOriginalId: relation.source.originalResourceId,
      target: relation.targetId,
      targetName: relation.target.title || null,
      targetOriginalId: relation.target.originalResourceId || null,
      targetType: null,
      type: relation.type,
    }),
  );

  const externalRelations: AllRelationsItem[] = version.ExternalRelation.map(
    (relation) => ({
      id: relation.id,
      action: relation.action || null,
      external: true,
      originalRelationId: relation.originalRelationId || null,
      resourceType: relation.resourceType,
      source: relation.sourceId,
      sourceName: relation.source.title,
      sourceOriginalId: relation.source.originalResourceId,
      target: relation.target,
      targetType: relation.targetType,
      type: relation.type,
    }),
  );

  const relations: AllRelationsItem[] = [
    ...internalRelations,
    ...externalRelations,
  ];

  return relations;
});
