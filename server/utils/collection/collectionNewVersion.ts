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
    const originalResources = latestVersion.Resources;
    const originalExternalRelations = latestVersion.ExternalRelations;
    const originalInternalRelations = latestVersion.InternalRelations;

    // clone each resource;
    const clonedResources = originalResources.map((resource) => {
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
      },
    });

    const clonedResourcesTransaction = prisma.version.update({
      data: {
        Resources: {
          create: clonedResources.map((resource) => {
            return {
              ...resource,
            };
          }),
        },
      },
      where: {
        id: draftVersion.id,
      },
    });

    const clonedRelationsTransaction = prisma.version.update({
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

    await prisma.$transaction([
      clonedResourcesTransaction,
      clonedRelationsTransaction,
    ]);

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
