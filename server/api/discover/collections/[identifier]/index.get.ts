export default defineEventHandler(async (event) => {
  const { identifier } = event.context.params as { identifier: string };

  const regex = /^[cv]\d+/;

  if (!regex.test(identifier)) {
    throw createError({
      message: "Invalid identifier",
      statusCode: 400,
    });
  }

  // Get the first character of the identifier
  const type = identifier[0];

  let versionId = parseInt(identifier.slice(1));

  // if the first character is "c" then it's a collection. We need to get the latest version of this collection
  if (type === "c") {
    const collectionId = parseInt(identifier.slice(1));

    const collection = await prisma.collection.findUnique({
      include: {
        Version: {
          orderBy: { created: "desc" },
          take: 1,
          where: { published: true },
        },
      },
      where: { id: collectionId },
    });

    if (!collection) {
      throw createError({
        message: "Collection not found",
        statusCode: 404,
      });
    }

    versionId = collection.Version[0].id;
  }

  const version = await prisma.version.findUnique({
    include: {
      collection: true,
      ExternalRelation: true,
      InternalRelation: true,
      Resource: true,
    },
    where: {
      id: versionId,
      collection: { private: false },
      published: true,
    },
  });

  if (!version) {
    throw createError({
      message: "Version not found",
      statusCode: 404,
    });
  }

  const allVersions = await prisma.version.findMany({
    orderBy: { created: "desc" },
    where: {
      collection: { private: false },
      collectionId: version.collectionId,
      published: true,
    },
  });

  const collectionIdentifier = `c${version.collectionId}`;

  await prisma.analytics.create({
    data: {
      event: "view",
      identifier: collectionIdentifier,
      type: "collection",
    },
  });

  await prisma.analytics.create({
    data: {
      event: "resolve",
      identifier: `v${version.id}`,
      type: "version",
    },
  });

  return {
    ...version,
    stars: Math.floor(Math.random() * 500),
    Versions: allVersions,
    views: Math.floor(Math.random() * 500),
  };
});
