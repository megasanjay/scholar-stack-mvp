import { z } from "zod";
import collectionMinEditorPermission from "~/server/utils/collection/collectionMinEditorPermission";
import touchCollection from "~/server/utils/collection/touchCollection";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const bodySchema = z
    .object({
      title: z.string().min(1),
      description: z.string(),
      identifier: z.string().min(1),
      identifierType: z.string().min(1),
      resourceType: z.string().min(1),
      versionLabel: z.string(),
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

  // Check if the resource exists in the draft version
  const resource = version.Resource.find((r) => r.id === resourceid);

  if (!resource) {
    throw createError({
      statusCode: 404,
      statusMessage: "Resource not found",
    });
  }

  if (resource.action === "clone") {
    resource.action = "update";
  }

  const {
    title,
    description,
    identifier,
    identifierType,
    resourceType,
    versionLabel,
  } = parsedBody.data;

  const updatedResource = await prisma.resource.update({
    data: {
      title,
      action: resource.action || "update",
      description,
      identifier,
      identifierType,
      resourceType,
      versionLabel,
    },
    where: {
      id: resourceid,
    },
  });

  if (!updatedResource) {
    throw createError({
      statusCode: 404,
      statusMessage: "Something went wrong",
    });
  }

  await touchCollection(collectionId);

  return {
    statusCode: 200,
    statusMessage: "Resource updated",
  };
});
