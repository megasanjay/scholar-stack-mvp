import { z } from "zod";
import { nanoid } from "nanoid";
import { createId } from "@paralleldrive/cuid2";
import type { Prisma } from "@prisma/client";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const { user } = session;
  const userId = user.id;

  // Check workspace admin permission
  await workspaceMinAdminPermission(event);

  const { workspaceid } = event.context.params as { workspaceid: string };

  // Read JSON body
  const body = await readBody(event);

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: "No data provided",
    });
  }

  const importData = body;

  // Validate import data structure
  const creatorSchema = z
    .object({
      affiliation: z.string(),
      creatorIndex: z.number(),
      creatorName: z.string(),
      familyName: z.string(),
      givenName: z.string().min(1),
      identifier: z.string(),
      identifierType: z.string(),
      nameType: z.union([z.literal("Personal"), z.literal("Organizational")]),
    })
    .refine((data) => {
      if (data.identifierType && !data.identifier) {
        return false;
      }

      if (data.identifier && !data.identifierType) {
        return false;
      }

      return true;
    });

  const importSchema = z
    .object({
      title: z.string().min(1),
      description: z.string(),
      type: z.string(),
      version: z.string().optional(),
      changelog: z.string().optional(),
      creators: z.array(creatorSchema).optional(),
      imageUrl: z.string().optional(),
      resources: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string().optional(),
          identifier: z.string(),
          identifierType: z.string(),
          resourceType: z.string(),
          resourceSubType: z.string().optional(),
          versionLabel: z.string().optional(),
        }),
      ),
      relations: z
        .object({
          internal: z
            .array(
              z.object({
                sourceId: z.string(),
                targetId: z.string(),
                type: z.string(),
                resourceType: z.string().optional(),
                mirror: z.boolean().optional(),
              }),
            )
            .optional(),
          external: z
            .array(
              z.object({
                sourceId: z.string(),
                target: z.string(),
                targetType: z.string(),
                type: z.string(),
                resourceType: z.string().optional(),
              }),
            )
            .optional(),
        })
        .optional(),
    })
    .strict();

  const parsedImportData = importSchema.safeParse(importData);

  if (!parsedImportData.success) {
    console.log(parsedImportData.error);
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid import file format",
    });
  }

  const {
    title,
    description,
    type,
    version: versionName,
    changelog,
    creators,
    imageUrl,
    resources,
    relations,
  } = parsedImportData.data;

  // Create the collection
  const collection = await prisma.collection.create({
    data: {
      CollectionAccess: {
        create: {
          role: "admin",
          userId,
        },
      },
      imageUrl:
        imageUrl || `https://api.dicebear.com/9.x/shapes/svg?seed=${nanoid()}`,
      type: type || "other",
      workspaceId: workspaceid,
    },
  });

  if (!collection) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create collection",
    });
  }

  // Create the version
  const creatorsJson = creators
    ? (creators as Prisma.JsonArray)
    : ([] as Prisma.JsonArray);

  const version = await prisma.version.create({
    data: {
      collectionId: collection.id,
      collectionTitle: title,
      collectionDescription: description || "",
      name: versionName || "Draft",
      changelog: changelog || "",
      creators: creatorsJson,
      published: false,
    },
  });

  if (!version) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create version",
    });
  }

  // Create resources and map old IDs to new IDs
  const resourceIdMap: Record<string, string> = {};

  for (const resourceData of resources) {
    const newResourceId = createId();

    const resource = await prisma.resource.create({
      data: {
        id: newResourceId,
        title: resourceData.title,
        description: resourceData.description || "",
        identifier: resourceData.identifier,
        identifierType: resourceData.identifierType,
        resourceType: resourceData.resourceType || "other",
        resourceSubType: resourceData.resourceSubType || null,
        versionLabel: resourceData.versionLabel || null,
        action: "create",
        canonicalId: newResourceId, // Will be updated after creation
        versionId: version.id,
      },
    });

    // Update canonicalId to match the resource id
    await prisma.resource.update({
      data: {
        canonicalId: resource.id,
      },
      where: { id: resource.id },
    });

    // Map old ID to new ID
    resourceIdMap[resourceData.id] = resource.id;
  }

  // Create internal relations
  if (relations?.internal) {
    for (const relationData of relations.internal) {
      const newSourceId = resourceIdMap[relationData.sourceId];
      const newTargetId = resourceIdMap[relationData.targetId];

      if (!newSourceId || !newTargetId) {
        console.warn(
          "Skipping internal relation: source or target resource not found",
        );
        continue;
      }

      await prisma.internalRelation.create({
        data: {
          sourceId: newSourceId,
          targetId: newTargetId,
          type: relationData.type,
          resourceType: relationData.resourceType || null,
          mirror: relationData.mirror || false,
          action: "create",
          versionId: version.id,
        },
      });
    }
  }

  // Create external relations
  if (relations?.external) {
    for (const relationData of relations.external) {
      const newSourceId = resourceIdMap[relationData.sourceId];

      if (!newSourceId) {
        console.warn("Skipping external relation: source resource not found");
        continue;
      }

      await prisma.externalRelation.create({
        data: {
          sourceId: newSourceId,
          target: relationData.target,
          targetType: relationData.targetType,
          type: relationData.type,
          resourceType: relationData.resourceType || null,
          action: "create",
          versionId: version.id,
        },
      });
    }
  }

  return {
    collectionId: collection.id,
    statusCode: 201,
    message: "Collection imported successfully",
  };
});
