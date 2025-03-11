import collectionMinEditorPermission from "~/server/utils/collection/collectionMinEditorPermission";
import touchCollection from "~/server/utils/collection/touchCollection";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await collectionMinEditorPermission(event);

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

  const draftVersion = await prisma.version.findFirst({
    where: {
      collectionId,
      published: false,
    },
  });

  if (!draftVersion) {
    throw createError({
      statusCode: 404,
      statusMessage: "Draft version not found",
    });
  }

  // Check if the resource exists in the draft version
  const resource = await prisma.resource.findUnique({
    where: { id: resourceid, versionId: draftVersion.id },
  });

  if (!resource) {
    throw createError({
      statusCode: 404,
      statusMessage: "Resource not found",
    });
  }

  // If the resource is new, we can delete it
  if (resource.action === "create") {
    await prisma.resource.delete({
      where: { id: resourceid },
    });

    await touchCollection(collectionId);

    return {
      statusCode: 200,
      statusMessage: "Resource removed",
    };
  }

  // Mark the resource as deleted
  await prisma.resource.update({
    data: {
      action: "delete",
    },
    where: { id: resourceid },
  });

  await touchCollection(collectionId);

  return {
    statusCode: 200,
    statusMessage: "Resource removed",
  };
});
