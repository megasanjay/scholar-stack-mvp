import { nanoid } from "nanoid";

/**
 * Create a new unpublished draft version of a collection
 * @param collectionid - The id of the collection to create a new version for
 */
const createNewVersion = async (collectionid: string) => {
  // get the latest version of the collection
  const latestVersion = await prisma.version.findFirst({
    orderBy: { created: "desc" },
    where: { collection_id: collectionid },
  });

  if (!latestVersion) {
    const draftVersion = await prisma.version.create({
      data: {
        name: "Draft",
        changelog: "xxx",
        collection_id: collectionid,
        identifier: `v${nanoid(8)}`,
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
        collection_id: collectionid,
        published: false,
      },
    });

    if (unpublishedVersions.length > 0) {
      throw createError({
        message: "There are multiple unpublished versions of this collection",
        statusCode: 422,
      });
    }

    const draftVersion = await prisma.version.create({
      data: {
        name: "Draft",
        changelog: "xxx",
        collection_id: collectionid,
        identifier: `v${nanoid(8)}`,
      },
    });

    // Get all the resources in the latest version

    const originalResources = await prisma.resource.findMany({
      where: {
        Version: {
          some: {
            id: latestVersion.id,
          },
        },
      },
    });

    // clone each resource into the staging table
    for (const originalResource of originalResources) {
      // clone the resource itself
      const newStagingResource = await prisma.resource.create({
        data: {
          title: originalResource.title,
          action: "clone",
          back_link_id: originalResource.back_link_id, // todo: check if this is correct
          description: originalResource.description,
          filled_in: true,
          identifier: originalResource.identifier,
          identifier_type: originalResource.identifier_type,
          original_resource_id: originalResource.id,
          resource_type: originalResource.resource_type,
          Version: {
            connect: {
              id: draftVersion.id,
            },
          },
          version_label: originalResource.version_label,
        },
      });

      // clone the relations to the resource

      // clone the external relations
      const originalExternalRelations = await prisma.externalRelation.findMany({
        where: {
          source_id: originalResource.id,
          Version: {
            some: {
              id: latestVersion.id,
            },
          },
        },
      });

      for (const originalExternalRelation of originalExternalRelations) {
        await prisma.externalRelation.create({
          data: {
            action: "clone",
            original_relation_id: originalExternalRelation.id,
            resource_type: originalExternalRelation.resource_type || null,
            source_id: newStagingResource.id,
            target: originalExternalRelation.target,
            target_type: originalExternalRelation.target_type,
            type: originalExternalRelation.type,
            Version: {
              connect: {
                id: draftVersion.id,
              },
            },
          },
        });
      }

      // clone the internal relations
      const originalInternalRelations = await prisma.internalRelation.findMany({
        where: {
          source_id: originalResource.id,
          Version: {
            some: {
              id: latestVersion.id,
            },
          },
        },
      });

      for (const originalInternalRelation of originalInternalRelations) {
        await prisma.internalRelation.create({
          data: {
            action: "clone",
            mirror: originalInternalRelation.mirror,
            original_relation_id: originalInternalRelation.id,
            resource_type: originalInternalRelation.resource_type,
            source_id: newStagingResource.id,
            target_id: originalInternalRelation.target_id,
            type: originalInternalRelation.type,
            Version: {
              connect: {
                id: draftVersion.id,
              },
            },
          },
        });
      }
    }

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
};

export default createNewVersion;
