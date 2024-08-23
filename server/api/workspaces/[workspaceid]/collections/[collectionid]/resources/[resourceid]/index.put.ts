import { z } from "zod";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

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
      message: "Missing required fields",
      statusCode: 400,
    });
  }

  // Check if the body is valid
  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    console.log(parsedBody.error);

    throw createError({
      message: "The provided parameters are invalid",
      statusCode: 400,
    });
  }

  await collectionMinEditorPermission(event);

  const { collectionid, resourceid, workspaceid } = event.context.params as {
    collectionid: string;
    resourceid: string;
    workspaceid: string;
  };

  const collection = await prisma.collection.findUnique({
    where: { id: collectionid, workspace_id: workspaceid },
  });

  if (!collection) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  // Check if the resource exists
  const resource = await prisma.resource.findUnique({
    where: { id: resourceid },
  });

  if (!resource) {
    throw createError({
      message: "Resource not found",
      statusCode: 404,
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
      filled_in: true,
      identifier,
      identifier_type: identifierType,
      resource_type: resourceType,
      version_label: versionLabel,
    },
    where: {
      id: resourceid,
    },
  });

  if (!updatedResource) {
    throw createError({
      message: "Something went wrong",
      statusCode: 404,
    });
  }

  await touchCollection(collectionid);

  return {
    message: "Resource updated",
    statusCode: 200,
  };
});
