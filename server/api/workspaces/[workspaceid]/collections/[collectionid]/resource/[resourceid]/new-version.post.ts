import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import collectionMinEditorPermission from "~/server/utils/collection/collectionMinEditorPermission";
import touchCollection from "~/server/utils/collection/touchCollection";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const bodySchema = z
    .object({
      cloneRelations: z.boolean(),
      identifier: z.string().min(1),
      identifierType: z.string().min(1),
      versionLabel: z.string().optional(),
    })
    .strict();

  const body = await readBody(event);

  // Check if the body is present
  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing required fields",
    });
  }

  // Check if the body is valid
  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    console.log(parsedBody.error);

    throw createError({
      statusCode: 400,
      statusMessage: "The provided parameters are invalid",
    });
  }

  await collectionMinEditorPermission(event);

  const { collectionid, resourceid, workspaceid } = event.context.params as {
    collectionid: string;
    resourceid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId, workspaceId: workspaceid },
  });

  if (!collection) {
    throw createError({
      statusCode: 404,
      statusMessage: "Collection not found",
    });
  }

  // get the latest version of the collection
  const version = await prisma.version.findFirst({
    include: {
      ExternalRelation: true,
      InternalRelation: true,
      Resource: true,
    },
    where: { collectionId, published: false },
  });

  // if there is no version return an error
  if (!version) {
    throw createError({
      statusCode: 404,
      statusMessage: "No draft version found",
    });
  }

  // get the resource
  const resource = version.Resource.find((resource) => {
    return resource.id === resourceid;
  });

  // if there is no resource return an error
  if (!resource) {
    throw createError({
      statusCode: 404,
      statusMessage: "Resource not found",
    });
  }

  // if the resource is new return an error
  if (resource.action === "create") {
    throw createError({
      statusCode: 400,
      statusMessage: "Resource is new",
    });
  }

  const { cloneRelations, identifier, identifierType, versionLabel } =
    parsedBody.data;

  // Add the new resource to the collection version
  const newResource = await prisma.resource.create({
    data: {
      title: resource.title,
      action: "create",
      // setting a default value but will be changed in the next step
      canonicalId: createId(),
      description: resource.description,
      identifier,
      identifierType,
      lineageId: resource.canonicalId,
      resourceSubType: resource.resourceSubType,
      resourceType: resource.resourceType,
      versionId: version.id,
      versionLabel: versionLabel || "",
    },
  });

  // The canonicalId needs to be updated to the newly created resource
  await prisma.resource.update({
    data: {
      canonicalId: newResource.id,
    },
    where: { id: newResource.id },
  });

  if (cloneRelations) {
    // Get all the resources in the latest version
    const InternalRelations = version.InternalRelation;
    const InternalRelationsForResource = InternalRelations.filter(
      (relation) => {
        return relation.sourceId === resource.id;
      },
    );

    // Clone the internal relations
    await prisma.internalRelation.createMany({
      data: InternalRelationsForResource.map((internalRelation) => {
        return {
          action: "create",
          mirror: internalRelation.mirror,
          originalRelationId: null,
          resourceType: internalRelation.resourceType,
          sourceId: newResource.id,
          targetId: internalRelation.targetId,
          type: internalRelation.type,
          versionId: version.id,
        };
      }),
    });

    const ExternalRelations = version.ExternalRelation;
    const ExternalRelationsForResource = ExternalRelations.filter(
      (relation) => {
        return relation.sourceId === resource.id;
      },
    );

    // Clone the external relations
    await prisma.externalRelation.createMany({
      data: ExternalRelationsForResource.map((externalRelation) => {
        return {
          action: "create",
          originalRelationId: null,
          resourceType: externalRelation.resourceType,
          sourceId: newResource.id,
          target: externalRelation.target,
          targetType: externalRelation.targetType,
          type: externalRelation.type,
          versionId: version.id,
        };
      }),
    });
  }

  await touchCollection(collectionId);

  return {
    resourceId: newResource.id,
    statusCode: 201,
  };
});
