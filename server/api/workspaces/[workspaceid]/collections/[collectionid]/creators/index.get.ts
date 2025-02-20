import collectionExists from "~/server/utils/collection/collectionExists";
import collectionMinViewerPermission from "~/server/utils/collection/collectionMinViewerPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  await collectionExists(event);
  await collectionMinViewerPermission(event);

  const { collectionid } = event.context.params as {
    collectionid: string;
  };

  const collectionId = parseInt(collectionid);

  // Get the latest version of the collection
  const version = await prisma.version.findFirst({
    where: {
      collectionId,
      published: false,
    },
  });

  if (!version) {
    return [];
  }

  const creators = (version?.creators as unknown as CollectionCreators) || [];

  // sort the creators by creatorIndex in ascending order to ensure that the creators are in the correct order
  creators.sort((a, b) => a.creatorIndex - b.creatorIndex);

  return creators;
});
