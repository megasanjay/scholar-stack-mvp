export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await workspaceMinViewerPermission(event);

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
  const internalRelations = await prisma.stagingInternalRelation.findMany({
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

  return {
    external: externalRelations,
    internal: internalRelations,
  };
});
