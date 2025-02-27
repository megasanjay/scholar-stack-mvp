import { z } from "zod";
import collectionMinEditorPermission from "~/server/utils/collection/collectionMinEditorPermission";
import touchCollection from "~/server/utils/collection/touchCollection";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const bodySchema = z
    .object({
      backLinkId: z.string().min(1),
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
  const resource = await prisma.resource.findUnique({
    where: { id: resourceid, versionId: version.id },
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

  // if the resource already has a new version return an error
  if (resource.action === "newVersion") {
    throw createError({
      statusCode: 400,
      statusMessage: "Resource already has a new version",
    });
  }

  // Add the new resource to the collection version
  const newResourceVersion = await prisma.resource.create({
    data: {
      title: resource.title,
      action: "newVersion",
      backLinkId: parsedBody.data.backLinkId, // used for front-end
      description: resource.description,
      identifier: resource.identifier,
      identifierType: resource.identifierType,
      resourceType: resource.resourceType,
      versionLabel: resource.versionLabel,
    },
  });

  // Add the 'oldVersion' action to the old version
  await prisma.resource.update({
    data: {
      action: "oldVersion",
    },
    where: { id: resourceid },
  });

  // todo: should the relations also be cloned for this new version?

  await prisma.version.update({
    data: {
      Resource: {
        connect: { id: newResourceVersion.id },
      },
    },
    where: { id: version.id },
  });

  await touchCollection(collectionId);

  return {
    resourceId: newResourceVersion.id,
    statusCode: 201,
  };
});
