export default defineEventHandler(async (event) => {
  const { identifier } = event.context.params as { identifier: string };

  const regex = /^[cv][a-zA-Z0-9-_]{8,9}$/;

  if (!regex.test(identifier)) {
    throw createError({
      message: "Invalid identifier",
      statusCode: 400,
    });
  }

  // Get the first character of the identifier
  const type = identifier[0];

  let versionIdentifier = "";

  // if the first character is "c" then it's a collection. We need to get the latest version of this collection
  if (type === "c") {
    const collection = await prisma.collection.findUnique({
      include: {
        Versions: {
          orderBy: { created: "desc" },
          take: 1,
          where: { published: true },
        },
      },
      where: { identifier },
    });

    if (!collection) {
      throw createError({
        message: "Collection not found",
        statusCode: 404,
      });
    }

    versionIdentifier = collection.Versions[0].identifier;
  } else {
    versionIdentifier = identifier;
  }

  const version = await prisma.version.findUnique({
    include: {
      collection: true,
      Resources: true,
    },
    where: {
      collection: { private: false },
      identifier: versionIdentifier,
      published: true,
    },
  });

  if (!version) {
    throw createError({
      message: "Version not found",
      statusCode: 404,
    });
  }

  return {
    ...version,
    stars: Math.floor(Math.random() * 500),
    views: Math.floor(Math.random() * 500),
  };
});
