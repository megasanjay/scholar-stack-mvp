import collectionMinViewerPermission from "~/server/utils/collection/collectionMinViewerPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  await collectionMinViewerPermission(event);

  const { collectionid, resourceid, workspaceid } = event.context.params as {
    collectionid: string;
    resourceid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId, workspaceId: workspaceid },
  });

  if (!collection) {
    throw createError({
      statusCode: 404,
      statusMessage: "Collection not found",
    });
  }

  // get the latest version of the collection
  const version = await prisma.version.findFirst({
    where: {
      collectionId,
      published: false,
    },
  });

  if (!version) {
    throw createError({
      statusCode: 404,
      statusMessage: "No version found",
    });
  }

  const resource = await prisma.resource.findUnique({
    where: {
      id: resourceid,
      versionId: version.id,
    },
  });

  if (!resource) {
    throw createError({
      statusCode: 404,
      statusMessage: "Resource not found",
    });
  }

  return resource;
});
