/**
 * Create a new unpublished draft version of a collection
 * @param collectionId - The id of the collection to create a new version for
 */

// TODO: Probably look into using a transaction here

export default async function (collectionId: number) {
  // get the latest version of the collection

  const latestVersion = await prisma.version.findFirst({
    include: {
      ExternalRelation: true,
      InternalRelation: true,
      Resource: true,
    },
    orderBy: { created: "desc" },
    where: { collectionId },
  });

  if (!latestVersion) {
    const draftVersion = await prisma.version.create({
      data: {
        name: "Draft",
        changelog: "xxx",
        collectionId,
      },
    });

    return {
      statusCode: 201,
      version: draftVersion,
    };
  }

  // if the latest version is published clone it into a draft version
  if (latestVersion.published) {
    // Check for other unpublished versions - sanity check
    const unpublishedVersions = await prisma.version.findMany({
      where: {
        collectionId,
        published: false,
      },
    });

    if (unpublishedVersions.length > 0) {
      throw createError({
        statusCode: 422,
        statusMessage:
          "There are multiple unpublished versions of this collection",
      });
    }

    const draftVersion = await prisma.version.create({
      data: {
        name: "Draft",
        changelog: "xxx",
        collectionId,
        creators: latestVersion.creators || "[]",
      },
    });

    // Get all the resources in the latest version
    const originalResources = latestVersion.Resource;

    // Clone the resources
    await prisma.resource.createMany({
      data: originalResources.map((resource) => {
        return {
          title: resource.title,
          action: "clone",
          backLinkId: null,
          description: resource.description,
          identifier: resource.identifier,
          identifierType: resource.identifierType,
          originalResourceId: resource.id,
          resourceType: resource.resourceType,
          versionId: draftVersion.id,
          versionLabel: resource.versionLabel,
        };
      }),
    });

    // Get all the resources in the latest version
    const clonedResources = await prisma.resource.findMany({
      where: {
        versionId: draftVersion.id,
      },
    });

    // Create a resource map for the ids of the original and cloned resources
    const resourceMap: Record<string, string> = {};

    for (const resource of originalResources) {
      const clonedResourceId = clonedResources.find(
        (clonedResource) => clonedResource.originalResourceId === resource.id,
      )?.id;

      if (!clonedResourceId) {
        throw createError({
          statusCode: 500,
          statusMessage: "Error cloning resources",
        });
      }

      resourceMap[resource.id] = clonedResourceId;
    }

    // Get all the external relations in the latest version
    const originalExternalRelations = latestVersion.ExternalRelation;

    // Clone the external relations
    await prisma.externalRelation.createMany({
      data: originalExternalRelations.map((externalRelation) => {
        return {
          action: "clone",
          originalRelationId: externalRelation.id,
          resourceType: externalRelation.resourceType,
          sourceId: resourceMap[externalRelation.sourceId],
          target: externalRelation.target,
          targetType: externalRelation.targetType,
          type: externalRelation.type,
          versionId: draftVersion.id,
        };
      }),
    });

    // Get all the internal relations in the latest version
    const originalInternalRelations = latestVersion.InternalRelation;

    // Clone the internal relations
    await prisma.internalRelation.createMany({
      data: originalInternalRelations.map((internalRelation) => {
        return {
          action: "clone",
          mirror: internalRelation.mirror,
          originalRelationId: internalRelation.id,
          resourceType: internalRelation.resourceType,
          sourceId: resourceMap[internalRelation.sourceId],
          targetId: resourceMap[internalRelation.targetId],
          type: internalRelation.type,
          versionId: draftVersion.id,
        };
      }),
    });

    return {
      statusCode: 201,
      version: draftVersion,
    };
  }

  // if there is a draft version, return it
  return {
    statusCode: 200,
    version: latestVersion,
  };
}
