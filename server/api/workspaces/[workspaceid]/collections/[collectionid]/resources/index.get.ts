import collectionMinViewerPermission from "~/server/utils/collection/collectionMinEditorPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await collectionMinViewerPermission(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  const { resourceid } = getQuery(event);

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
    latestVersion?.Resource?.map((resource) => {
      return {
        action: resource.action,
        disabled: resourceid === resource.id || resource.action === "delete",
        label: resource.title,
        value: resource.id,
        versionLabel: resource.versionLabel,
      };
    }) || [];

  return response;
});
