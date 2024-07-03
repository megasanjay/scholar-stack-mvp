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
  const resources = await prisma.resource.findMany({
    include: {
      Version: {
        select: {
          name: true,
        },
      },
    },
    where: {
      Version: {
        some: {
          collection_id: collectionid,
        },
      },
    },
  });

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

    allResources.push({ ...resource, versionName: resource.Version[0].name });
    allResourceIds.push(resource.id);
  }

  // If a resource is cloned, remove the original resource from the list in favor of the cloned resource
  for (let i = 0; i < allResources.length; i++) {
    const resource = allResources[i];

    if (resource.original_resource_id) {
      const originalResourceIndex = allResources.findIndex(
        (r) => r.id === resource.original_resource_id,
      );

      if (originalResourceIndex !== -1) {
        allResources.splice(originalResourceIndex, 1);
        i--;
      }
    }
  }

  for (const resource of allResources) {
    const item = {
      label: resource.title,
      latestCollectionVersionName: resource.versionName,
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
