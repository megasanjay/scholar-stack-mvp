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
  const versions = await prisma.version.findMany({
    where: {
      collection_id: collectionid,
    },
  });

  const response: ResourcesList = [];

  const allResources = [];
  const allResourceIds = [];

  // get the resources for each version

  for (const version of versions) {
    const resources = await prisma.resource.findMany({
      where: {
        Version: {
          some: {
            id: version.id,
          },
        },
      },
    });

    for (const resource of resources) {
      if (resource.original_resource_id) {
        // remove the original resource from the list in favor of the cloned resource
        const originalResourceIndex = allResources.findIndex(
          (r) => r.id === resource.original_resource_id,
        );

        if (originalResourceIndex !== -1) {
          allResources.splice(originalResourceIndex, 1);
        }
      }

      if (
        resource.action &&
        (resource.action === "delete" || resource.action === "oldVersion")
      ) {
        continue;
      }

      allResources.push({
        ...resource,
        versionName: version.name,
      });
      allResourceIds.push(resource.id);
    }
  }

  // Get a unique list of all the resource ids keeping the order of the first occurrence that is not the draft version
  const uniqueResourceIds = allResourceIds.filter(
    (value, index, self) => self.indexOf(value) === index,
  );

  // Remove the resources that are not in the collection
  const filteredResources = allResources.filter((resource) =>
    uniqueResourceIds.includes(resource.id),
  );

  // sort the resources by the version name in descending order
  filteredResources.sort((a, b) => {
    if (a.versionName < b.versionName) {
      return 1;
    }
    if (a.versionName > b.versionName) {
      return -1;
    }

    return 0;
  });

  // remove earlier versions of the same resource
  const seen = new Set();
  const resources = filteredResources.filter((resource) => {
    const duplicate = seen.has(resource.id);

    seen.add(resource.id);

    return !duplicate;
  });

  const currentResource = null;

  for (const resource of resources) {
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
