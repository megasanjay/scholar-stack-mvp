import { z } from "zod";

export default defineEventHandler(async (event) => {
  const { collectionid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  // get the draft versions of the collection
  const versions = await prisma.version.findMany({
    include: {
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
