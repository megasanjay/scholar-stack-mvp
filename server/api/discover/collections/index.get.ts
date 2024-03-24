export default defineEventHandler(async (_event) => {
  const publishedVersions = await prisma.version.findMany({
    include: {
      collection: true,
    },
    orderBy: {
      published_on: "desc",
    },
    where: { collection: { private: false }, published: true },
  });

  // This needs to go on redis
  for (const version of publishedVersions) {
    const count = await prisma.analytics.count({
      where: {
        identifier: version.collection.identifier,
      },
    });

    version.views = count;
  }

  return publishedVersions.map((version) => {
    return {
      ...version,
      stars: Math.floor(Math.random() * 500),
    };
  });
});
