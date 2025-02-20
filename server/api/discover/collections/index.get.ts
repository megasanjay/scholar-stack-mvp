const pageSize = 10;

export default defineEventHandler(async (event) => {
  const { page } = getQuery(event);

  const parsedPage = page ? parseInt(page as unknown as string, 10) : 0;

  const publishedVersions = await prisma.version.findMany({
    include: {
      collection: true,
    },
    orderBy: {
      publishedOn: "desc",
    },
    skip: parsedPage * pageSize,
    take: pageSize,
    where: { collection: { private: false }, published: true },
  });

  const response = publishedVersions.map((version) => {
    return {
      ...version,
      stars: 0,
      views: 0,
    };
  });

  // This needs to go on dragonflydb
  for (const version of response) {
    const viewCount = await prisma.analytics.count({
      where: {
        identifier: version.collection.id.toString(),
      },
    });

    const starCount = await prisma.starred.count({
      where: {
        collectionId: version.collection.id,
      },
    });

    version.views = viewCount;
    version.stars = starCount;
  }

  // Get the total number of published collections
  const total = await prisma.version.count({
    where: { collection: { private: false }, published: true },
  });

  const totalPages = Math.ceil(total / pageSize);

  return {
    collections: response || [],
    total: totalPages,
  };
});
