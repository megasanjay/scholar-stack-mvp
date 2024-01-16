import { z } from "zod";

export default defineEventHandler(async (event) => {
  const { collectionid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  // get the draft versions of the collection
  const versions = await prisma.version.findMany({
    include: {
      Resources: true,
    },
    orderBy: { created: "desc" },
    where: { collection_id: collectionid, published: false },
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

  const resources = version.Resources;

  const resourceSchema = z.object({
    title: z.string().min(1),
    description: z.string(),
    icon: z.string().min(1),
    target: z.string().min(1),
    type: z.string().min(1),
  });

  const resourcesWithErrors = [];

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

    // todo: might also need to validate the relations
    // Although this might be handled at relation post so might not be needed
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
