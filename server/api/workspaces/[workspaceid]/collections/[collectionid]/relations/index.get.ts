export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await collectionMinViewerPermission(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
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

  // get the latest version of the collection.
  // This is either the draft or the latest published version
  const version = await prisma.version.findFirst({
    include: {
      ExternalRelations: {
        include: {
          source: true,
        },
      },
      InternalRelations: {
        include: {
          source: true,
          target: true,
        },
      },
    },
    orderBy: { created: "desc" },
    take: 1,
    where: { collection_id: collectionid },
  });

  if (!version) {
    throw createError({
      message: "No version found",
      statusCode: 404,
    });
  }

  // get all the relations for the collection
  const internalRelations = version.InternalRelations.map((relation) => ({
    id: relation.id,
    action: relation.action || null,
    created: relation.created,
    external: false,
    original_relation_id: relation.original_relation_id || null,
    resource_type: relation.resource_type,
    source_id: relation.source_id,
    source_name: relation.source.title,
    source_original_id: relation.source.original_resource_id,
    target: relation.target_id,
    target_name: relation.target.title || null,
    target_original_id: relation.target.original_resource_id || null,
    target_type: null,
    type: relation.type,
    updated: relation.updated,
  }));

  const externalRelations = version.ExternalRelations.map((relation) => ({
    id: relation.id,
    action: relation.action || null,
    created: relation.created,
    external: true,
    original_relation_id: relation.original_relation_id || null,
    resource_type: relation.resource_type,
    source_id: relation.source_id,
    source_name: relation.source.title,
    source_original_id: relation.source.original_resource_id,
    target: relation.target,
    target_type: relation.target_type,
    type: relation.type,
    updated: relation.updated,
  }));

  const relations: GroupedRelation[] = [
    ...internalRelations,
    ...externalRelations,
  ];

  return relations;
});
