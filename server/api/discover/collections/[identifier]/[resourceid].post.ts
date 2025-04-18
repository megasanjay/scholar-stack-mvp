export default defineEventHandler(async (event) => {
  const { identifier, resourceid } = event.context.params as {
    identifier: string;
    resourceid: string;
  };

  const versionId = parseInt(identifier);

  const version = await prisma.version.findUnique({
    include: { Resource: true },
    where: { id: versionId, collection: { private: false }, published: true },
  });

  if (!version) {
    throw createError({ message: "Collection not found", statusCode: 404 });
  }

  // Check if the resource id is part of the collection
  const resource = version.Resource.find(
    (resource) => resource.id === resourceid,
  );

  if (!resource) {
    throw createError({ message: "Resource not found", statusCode: 404 });
  }

  // update the click count
  await prisma.resource.update({
    data: {
      clicks: {
        increment: 1,
      },
    },
    where: { id: resource.id },
  });

  return { statusCode: 200 };
});
