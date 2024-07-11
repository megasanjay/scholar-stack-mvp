export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await collectionMinEditorPermission(event);

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

  // get the latest version for the collection
  const latestVersion = await prisma.version.findFirst({
    include: {
      Resources: true,
    },
    orderBy: {
      created: "desc",
    },
    where: {
      collection_id: collectionid,
    },
  });

  // get all the versions for the collection
  // const versions = await prisma.version.findMany({
  //   where: {
  //     collection_id: collectionid,
  //   },
  // });

  const response: ResourcesList = [];

  const allResources = [];
  const allResourceIds = [];

  // get all the resources for the collection
  const resources = latestVersion?.Resources || [];

  // Remove any duplicate resources and any resources that have the delete or oldVersion action
  const seen = new Set();

  for (const resource of resources) {
    const duplicate = seen.has(resource.id);

    seen.add(resource.id);

    if (duplicate) {
      continue;
    }

    if (
      resource.action &&
      (resource.action === "delete" || resource.action === "oldVersion")
    ) {
      continue;
    }

    allResources.push({ ...resource, versionName: latestVersion?.name });
    allResourceIds.push(resource.id);
  }

  for (const resource of allResources) {
    const item = {
      action: resource.action,
      label: resource.title || "Unnamed Resource",
      orignalResourceId:
        "original_resource_id" in resource
          ? resource.original_resource_id
          : null,
      value: resource.id,
      versionLabel: resource.version_label,
    };

    response.push(item);
  }

  return response;
});
