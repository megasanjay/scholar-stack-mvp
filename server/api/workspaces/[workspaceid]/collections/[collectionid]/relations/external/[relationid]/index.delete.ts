import collectionMinEditorPermission from "~/server/utils/collection/collectionMinEditorPermission";
import touchCollection from "~/server/utils/collection/touchCollection";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await collectionMinEditorPermission(event);

  const { collectionid, relationid, workspaceid } = event.context.params as {
    collectionid: string;
    relationid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId, workspaceId: workspaceid },
  });

  if (!collection) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  // get the draft version of the collection.
  const version = await prisma.version.findFirst({
    include: {
      ExternalRelation: true,
    },

    where: { collectionId, published: false },
  });

  // Check if the relation is part of the draft version
  const relation = version?.ExternalRelation.find((r) => r.id === relationid);

  if (!relation) {
    throw createError({
      message: "Relations can only be removed from draft version",
      statusCode: 404,
    });
  }
  // Delete the relation
  if (!relation.originalRelationId) {
    await prisma.externalRelation.delete({
      where: { id: relationid },
    });
  } else {
    await prisma.externalRelation.update({
      data: {
        action: "delete",
      },
      where: { id: relationid },
    });
  }

  await touchCollection(collectionId);

  return {
    message: "Relation removed",
    statusCode: 204,
  };
});
