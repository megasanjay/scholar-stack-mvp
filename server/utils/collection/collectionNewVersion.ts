import { nanoid } from "nanoid";
import { createId } from "@paralleldrive/cuid2";

/**
 * Create a new unpublished draft version of a collection
 * @param collectionid - The id of the collection to create a new version for
 */
const createNewVersion = async (collectionid: string) => {
  // get the latest version of the collection
  const latestVersion = await prisma.version.findFirst({
    include: {
      ExternalRelations: true,
      InternalRelations: true,
      Resources: true,
    },
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

    // Get all the resources in the latest version
    const orignalResources = latestVersion.Resources;
    const originalExternalRelations = latestVersion.ExternalRelations;
    const originalInternalRelations = latestVersion.InternalRelations;

    // clone each resource;
    const clonedResources = orignalResources.map((resource) => {
      return {
        id: createId(),
        title: resource.title,
        action: "clone",
        back_link_id: resource.back_link_id, // todo: check if this is correct
        description: resource.description,
        filled_in: true,
        identifier: resource.identifier,
        identifier_type: resource.identifier_type,
        original_resource_id: resource.id,
        resource_type: resource.resource_type,
        version_label: resource.version_label,
      };
    });

    const clonedExternalRelations = originalExternalRelations.map(
      (externalRelation) => {
        const externalRelationClonedSourceResource = clonedResources.find(
          (resource) =>
            resource.original_resource_id === externalRelation.source_id,
        );

        // todo: what to do if this is not found?
        // This should never happen but we probably need some thing here regardless
        const externalRelationClonedSourceResourceId =
          externalRelationClonedSourceResource?.id as string;

        return {
          id: createId(),
          action: "clone",
          original_relation_id: externalRelation.id,
          resource_type: externalRelation.resource_type || null,
          source_id: externalRelationClonedSourceResourceId,
          target: externalRelation.target,
          target_type: externalRelation.target_type,
          type: externalRelation.type,
        };
      },
    );

    const clonedInternalRelations = originalInternalRelations.map(
      (internalRelation) => {
        const internalRelationClonedSourceResource = clonedResources.find(
          (resource) =>
            resource.original_resource_id === internalRelation.source_id,
        );

        const internalRelationClonedSourceResourceId =
          internalRelationClonedSourceResource?.id as string;

        return {
          id: createId(),
          action: "clone",
          mirror: internalRelation.mirror,
          original_relation_id: internalRelation.id,
          resource_type: internalRelation.resource_type,
          source_id: internalRelationClonedSourceResourceId,
          target_id: internalRelation.target_id,
          type: internalRelation.type,
        };
      },
    );

    const draftVersion = await prisma.version.create({
      data: {
        name: "Draft",
        changelog: "xxx",
        collection_id: collectionid,

        identifier: `v${nanoid(8)}`,

        Resources: {
          create: clonedResources.map((resource) => {
            return {
              ...resource,
            };
          }),
        },
      },
    });

    const updatedDraftVersion = await prisma.version.update({
      data: {
        ExternalRelations: {
          create: clonedExternalRelations.map((externalRelation) => {
            return {
              ...externalRelation,
            };
          }),
        },
        InternalRelations: {
          create: clonedInternalRelations.map((internalRelation) => {
            return {
              ...internalRelation,
            };
          }),
        },
      },
      where: {
        id: draftVersion.id,
      },
    });

    console.log("updatedDraftVersion", updatedDraftVersion);

    // Connect the resources to the draft version
    // Will have to do this manually as prisma does not support nested createMany

    // const connectedRecordsCount =
    //   await prisma.$executeRaw`INSERT INTO "_ResourceToVersion" ("A", "B") VALUES ${resourcesData.map(
    //     (resource) => [resource.id, draftVersion.id],
    //   )}`;

    // if (connectedRecordsCount !== resourcesData.length) {
    //   throw createError({
    //     message: "Failed to connect resources to the new version",
    //     statusCode: 500,
    //   });
    // }

    // clone the external relations
    // const externalRelationsData = originalExternalRelations.map(
    //   (externalRelation) => {
    //     const externalRelationClonedSourceResource = clonedResources.find(
    //       (resource) =>
    //         resource.original_resource_id === externalRelation.source_id,

    //     // todo: what to do if this is not found?
    //     // This should never happen but we probably need some thing here regardless
    //     const externalRelationClonedSourceResourceId =
    //       externalRelationClonedSourceResource?.id as string;

    //     return {
    //       id: createId(),
    //       action: "clone",
    //       original_relation_id: externalRelation.id,
    //       resource_type: externalRelation.resource_type || null,
    //       source_id: externalRelationClonedSourceResourceId,
    //       target: externalRelation.target,
    //       target_type: externalRelation.target_type,
    //       type: externalRelation.type,
    //     };
    //   },
    // );

    // create the external relations
    // await prisma.externalRelation.createMany({
    //   data: externalRelationsData,
    // });

    // Connect the external relations to the draft version

    // const connectedExternalRelationsCount =
    //   await prisma.$executeRaw`INSERT INTO "_ExternalRelationToVersion" ("A", "B") VALUES ${externalRelationsData.map(
    //     (externalRelation) => [externalRelation.id, draftVersion.id],
    //   )}`;

    // if (connectedExternalRelationsCount !== externalRelationsData.length) {
    //   throw createError({
    //     message: "Failed to connect external relations to the new version",
    //     statusCode: 500,
    //   });
    // }

    // const internalRelationsData = await originalInternalRelations.map(
    //   (internalRelation) => {
    //     const internalRelationClonedSourceResource = resourcesData.find(
    //       (resource) =>
    //         resource.original_resource_id === internalRelation.source_id,
    //     );

    //     const internalRelationClonedSourceResourceId =
    //       internalRelationClonedSourceResource?.id as string;

    //     return {
    //       id: createId(),
    //       action: "clone",
    //       mirror: internalRelation.mirror,
    //       original_relation_id: internalRelation.id,
    //       resource_type: internalRelation.resource_type,
    //       source_id: internalRelationClonedSourceResourceId,
    //       target_id: internalRelation.target_id,
    //       type: internalRelation.type,
    //     };
    //   },
    // );

    // await prisma.internalRelation.createMany({
    //   data: internalRelationsData,
    // });

    // Connect the internal relations to the draft version

    // const connectedInternalRelationsCount =
    //   await prisma.$executeRaw`INSERT INTO "_InternalRelationToVersion" ("A", "B") VALUES ${internalRelationsData.map(
    //     (internalRelation) => [internalRelation.id, draftVersion.id],
    //   )}`;

    // if (connectedInternalRelationsCount !== internalRelationsData.length) {
    //   throw createError({
    //     message: "Failed to connect internal relations to the new version",
    //     statusCode: 500,
    //   });
    // }

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
