export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await collectionMinViewerPermission(event);

  const { collectionid, resourceid, workspaceid } = event.context.params as {
    collectionid: string;
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

  // Check if the resource is part of the collection version
  const resource = await prisma.resource.findUnique({
    where: {
      id: resourceid,
      Version: {
        some: {
          collection_id: collectionid,
        },
      },
    },
  });

  if (!resource) {
    throw createError({
      message: "Resource not found",
      statusCode: 404,
    });
  }

  // get the latest version of the collection.
  // This is either the draft or the latest published version
  const version = await prisma.version.findFirst({
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

  // get all the relations for the resource
  const internalRelations = await prisma.internalRelation.findMany({
    orderBy: {
      created: "asc",
    },
    where: {
      source_id: resourceid,
      Version: {
        some: {
          id: version.id,
        },
      },
    },
  });

  const externalRelations = await prisma.externalRelation.findMany({
    orderBy: {
      created: "asc",
    },
    where: {
      source_id: resourceid,
      Version: {
        some: {
          id: version.id,
        },
      },
    },
  });

  const relations: GroupedRelation[] = [
    ...internalRelations.map((relation) => ({
      id: relation.id,
      action: relation.action || null,
      created: relation.created,
      resource_type: relation.resource_type,
      target: relation.target_id,
      target_location: "internal",
      target_type: "loopback",
      type: relation.type,
      updated: relation.updated,
    })),
    ...externalRelations.map((relation) => ({
      id: relation.id,
      action: relation.action || null,
      created: relation.created,
      resource_type: relation.resource_type,
      target: relation.target,
      target_location: "external",
      target_type: relation.target_type,
      type: relation.type,
      updated: relation.updated,
    })),
  ];

  return relations;
});
