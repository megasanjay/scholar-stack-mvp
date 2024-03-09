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

  console.log(publishedVersions.length);

  return publishedVersions.map((version) => {
    return {
      ...version,
      stars: Math.floor(Math.random() * 500),
      views: Math.floor(Math.random() * 500),
    };
  });
});
