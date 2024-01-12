export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await workspaceMinEditorPermission(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const { resourceid } = getQuery(event);

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
    if (version.published === false) {
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
          continue;
        }

        if (resourceid && resource.id === resourceid) {
          continue;
        }

        if (resource.action === "delete" || resource.action === "oldVersion") {
          continue;
        }

        allResources.push({
          ...resource,
          versionName: version.name,
        });
        allResourceIds.push(resource.id);
      }
    } else {
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
        allResources.push({
          ...resource,
          versionName: version.name,
        });
        allResourceIds.push(resource.id);
      }
    }
  }

  // Get a unique list of all the resource ids keeping the order of the first occurrence that is not the draft version
  const uniqueResourceIds = allResourceIds.filter(
    (value, index, self) => self.indexOf(value) === index
  );

  // Remove the resources that are not in the collection
  const resources = allResources.filter((resource) =>
    uniqueResourceIds.includes(resource.id)
  );

  let currentResource = null;

  if (resourceid) {
    currentResource = await prisma.resource.findUnique({
      where: {
        id: resourceid as string,
      },
    });

    if (!currentResource) {
      throw createError({
        message: "Resource not found",
        statusCode: 404,
      });
    }
  }

  for (const resource of resources) {
    console.log(resource.action);

    const item = {
      disabled:
        !!(
          currentResource &&
          "original_resource_id" in currentResource &&
          currentResource.original_resource_id === resource.id
        ) ||
        (resource.action && resource.action === "delete"),
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
