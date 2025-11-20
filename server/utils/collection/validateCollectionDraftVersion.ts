import { z } from "zod";
import RELATION_TYPE_JSON from "@/assets/json/relation-type.json";

export default defineEventHandler(async (event) => {
  const { collectionid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  // get the draft versions of the collection
  const versions = await prisma.version.findMany({
    include: {
      ExternalRelation: true,
      InternalRelation: true,
      Resource: true,
    },
    orderBy: { created: "desc" },
    where: { collectionId, published: false },
  });

  if (versions.length === 0) {
    throw createError({
      message: "There are no unpublished versions of this collection",
      statusCode: 404,
    });
  }

  if (versions.length > 1) {
    throw createError({
      message: "There are multiple unpublished versions of this collection",
      statusCode: 500,
    });
  }

  const version = versions[0];

  const resources = version.Resource;

  const resourceSchema = z.object({
    title: z.string().min(1),
    description: z.string(),
    identifier: z.string().min(1),
    identifierType: z.string().min(1),
    resourceType: z.string().min(1),
  });

  const resourcesWithErrors = [];

  const identifiers: string[] = [];

  // Create a map of resource IDs to titles for efficient lookups
  const resourcesMap = new Map(
    resources.map((resource) => [resource.id, resource]),
  );

  for (const resource of resources) {
    // validate the resource
    const parsedResource = resourceSchema.safeParse(resource);

    if (!parsedResource.success) {
      resourcesWithErrors.push({
        ...parsedResource.error,
        id: resource.id,
        title: resource.title,
      });
    }

    const identifier = `${resource.identifierType}:${resource.identifier.trim().toLowerCase()}:${resource.versionLabel?.trim().toLowerCase()}`;

    // Check if the resource identifier is unique
    if (identifiers.includes(identifier)) {
      resourcesWithErrors.push({
        id: resource.id,
        title: resource.title,
        message: "Identifier is not unique",
      });
    }

    identifiers.push(identifier);
  }

  // Check if there are any relations with the same source and target
  const internalRelations = version.InternalRelation;

  for (const relation of internalRelations) {
    if (relation.sourceId === relation.targetId) {
      const resource = resourcesMap.get(relation.sourceId);

      resourcesWithErrors.push({
        id: resource?.id,
        title: resource?.title || "Unknown resource",
        message: "Relation has the same source and target",
      });
    }
  }

  // Check for duplicate relations
  const seenRelations = new Set<string>();

  // Check internal relations
  for (const relation of internalRelations) {
    const relationKey = `${relation.sourceId}:${relation.targetId}:${relation.type}`;

    if (seenRelations.has(relationKey)) {
      const resource = resourcesMap.get(relation.sourceId);

      resourcesWithErrors.push({
        id: resource?.id,
        title: resource?.title || "Unknown resource",
        message:
          "Duplicate relation found with same source, target, and relation type",
      });
    }

    seenRelations.add(relationKey);

    // check the flipped relation as well just in case
    const flippedRelationKey = `${relation.targetId}:${relation.sourceId}:${relation.type}`;

    if (seenRelations.has(flippedRelationKey)) {
      const resource = resourcesMap.get(relation.targetId);

      resourcesWithErrors.push({
        id: resource?.id,
        title: resource?.title || "Unknown resource",
        message:
          "Duplicate relation found with same source, target, and relation type",
      });
    }

    seenRelations.add(flippedRelationKey);
  }

  // clear the seen relations
  seenRelations.clear();

  // Check external relations
  const externalRelations = version.ExternalRelation;

  for (const relation of externalRelations) {
    const relationKey = `${relation.sourceId}:${relation.target}:${relation.type}`;

    if (seenRelations.has(relationKey)) {
      const resource = resourcesMap.get(relation.sourceId);

      resourcesWithErrors.push({
        id: resource?.id,
        title: resource?.title || "Unknown resource",
        message:
          "Duplicate relation found with same source, target, and relation type",
      });
    }

    seenRelations.add(relationKey);
  }

  // If any relation type is IsNewVersionOf, IsPreviousVersionOf or IsVersionOf, check if the version label is provided for both the source and target for internal relations and source for external relations

  for (const relation of internalRelations) {
    if (
      relation.type === "IsNewVersionOf" ||
      relation.type === "IsPreviousVersionOf" ||
      relation.type === "IsVersionOf"
    ) {
      const sourceResource = resourcesMap.get(relation.sourceId);

      if (!sourceResource?.versionLabel) {
        resourcesWithErrors.push({
          id: sourceResource?.id,
          title: sourceResource?.title || "Unknown resource",
          message:
            "If a relation of `Is New Version Of`, `Is Previous Version Of` or `Is Version Of` is provided, then a `Version` must be provided for both the source and target resources",
        });
      }

      const targetResource = resourcesMap.get(relation.targetId);

      if (!targetResource?.versionLabel) {
        resourcesWithErrors.push({
          id: targetResource?.id,
          title: targetResource?.title || "Unknown resource",
          message:
            "If a relation of `Is New Version Of`, `Is Previous Version Of` or `Is Version Of` is provided, then a `Version` must be provided for both the source and target resources",
        });
      }
    }
  }

  for (const relation of externalRelations) {
    if (
      relation.type === "IsNewVersionOf" ||
      relation.type === "IsPreviousVersionOf" ||
      relation.type === "IsVersionOf"
    ) {
      const sourceResource = resourcesMap.get(relation.sourceId);

      if (!sourceResource?.versionLabel) {
        resourcesWithErrors.push({
          id: relation.id,
          title: sourceResource?.title || "Unknown resource",
          message:
            "If a relation of `Is New Version Of`, `Is Previous Version Of` or `Is Version Of` is provided, then a `Version` must be provided for the source resource",
        });
      }
    }
  }

  // Check internal relations for mirror relations
  for (const relation of internalRelations) {
    const relationType = relation.type;

    const mirrorRelationType =
      RELATION_TYPE_JSON.find((type) => type.value === relationType)?.mirror ||
      "";

    if (mirrorRelationType) {
      if (relation.sourceId === relation.targetId) {
        continue;
      }

      const mirrorRelation = internalRelations.find(
        (r) =>
          r.sourceId === relation.targetId &&
          r.targetId === relation.sourceId &&
          r.type === mirrorRelationType,
      );

      const sourceResource = resourcesMap.get(relation.sourceId);

      if (mirrorRelation) {
        resourcesWithErrors.push({
          id: relation.id,
          title: sourceResource?.title || "Unknown resource",
          message: "Mirror relation found",
        });
      }
    }
  }

  if (resourcesWithErrors.length > 0) {
    return {
      errors: resourcesWithErrors,
      valid: false,
    };
  }

  return {
    valid: true,
  };
});
