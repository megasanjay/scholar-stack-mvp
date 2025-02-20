import collectionMinEditorPermission from "~/server/utils/collection/collectionMinEditorPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await collectionMinEditorPermission(event);

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

  // get the latest version for the collection
  const latestVersion = await prisma.version.findFirst({
    include: {
      Resource: true,
    },
    where: {
      collectionId,
      published: false,
    },
  });

  const response: ResourcesList =
    latestVersion?.Resource.map((resource) => {
      return {
        action: resource.action,
        label: resource.title || "Unnamed Resource",
        value: resource.id,
        versionLabel: resource.versionLabel,
      };
    }) || [];

  return response;
});
