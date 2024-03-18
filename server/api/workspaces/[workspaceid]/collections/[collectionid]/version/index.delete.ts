export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await collectionMinAdminPermission(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
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

  const draftVersion = await prisma.version.findFirst({
    include: {
      Resources: true,
    },
    where: {
      collection_id: collectionid,
      published: false,
    },
  });

  if (!draftVersion) {
    throw createError({
      message: "Draft version not found",
      statusCode: 404,
    });
  }

  const resources = draftVersion.Resources;

  // remove all resources from the draft version
  for (const resource of resources) {
    await prisma.resource.delete({
      where: { id: resource.id },
    });
  }

  // delete the draft version
  await prisma.version.delete({
    where: { id: draftVersion.id },
  });

  // get the latest released version of the collection to reset the creators
  const latestReleasedVersion = await prisma.version.findFirst({
    orderBy: {
      created: "desc",
    },
    where: {
      collection_id: collectionid,
      published: true,
    },
  });

  // reset the creators of the collection to the latest released version
  await prisma.collection.update({
    data: {
      creators: latestReleasedVersion?.creators || [],
    },
    where: { id: collectionid },
  });

  const { statusCode } = await collectionNewVersion(collectionid);

  if (statusCode !== 201) {
    throw createError({
      message: "Failed to create collection version",
      statusCode: 500,
    });
  }

  return {
    message: "Draft version deleted",
    statusCode: 200,
  };
});
