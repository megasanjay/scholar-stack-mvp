import calver from "calver";
import collectionMinAdminPermission from "~/server/utils/collection/collectionMinAdminPermission";
import validateCollectionDraftVersion from "~/server/utils/collection/validateCollectionDraftVersion";
import collectionNewVersion from "~/server/utils/collection/collectionNewVersion";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await collectionMinAdminPermission(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  const collection = await prisma.collection.findUnique({
    where: {
      id: collectionId,
      workspaceId: workspaceid,
    },
  });

  if (!collection) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  const validationResults = await validateCollectionDraftVersion(event);

  if (!validationResults.valid) {
    throw createError({
      message: "Collection is not valid",
      statusCode: 422,
    });
  }

  const draftVersion = await prisma.version.findFirst({
    include: {
      ExternalRelation: true,
      InternalRelation: true,
      Resource: true,
    },
    where: {
      collectionId,
      published: false,
    },
  });

  if (!draftVersion) {
    throw createError({
      message: "There is no draft version to publish",
      statusCode: 404,
    });
  }

  // get the last published version
  const lastPublishedVersion = await prisma.version.findFirst({
    orderBy: {
      publishedOn: "desc",
    },
    where: {
      collectionId,
      published: true,
    },
  });

  /**
   * ! Start the publish process
   *
   * * Create a new version
   * * Map the staging resources to resources in the new version
   * * Map the staging external relations to external relations in the new version
   * * Map the staging internal relations to internal relations in the new version
   */

  const resources = draftVersion.Resource;

  // Remove the deleted resources from the resources array
  const deletedResources = resources.filter(
    (resource) => resource.action === "delete",
  );

  await prisma.resource.deleteMany({
    where: {
      id: {
        in: deletedResources.map((resource) => resource.id),
      },
    },
  });

  // Remove the old version resources from the resources array
  const oldVersionResources = resources.filter(
    (resource) => resource.action === "oldVersion",
  );

  await prisma.resource.deleteMany({
    where: {
      id: {
        in: oldVersionResources.map((resource) => resource.id),
      },
    },
  });

  // Clean up the rest of the resources
  const clonedResources = resources.filter(
    (resource) => resource.action === "clone",
  );

  await prisma.resource.updateMany({
    data: {
      action: null,
      originalResourceId: null,
    },
    where: {
      id: {
        in: clonedResources.map((resource) => resource.id),
      },
    },
  });

  const updatedResources = resources.filter(
    (resource) => resource.action === "update",
  );

  await prisma.resource.updateMany({
    data: {
      action: null,
      originalResourceId: null,
    },
    where: {
      id: {
        in: updatedResources.map((resource) => resource.id),
      },
    },
  });

  const newResources = resources.filter(
    (resource) => resource.action === "create",
  );

  await prisma.resource.updateMany({
    data: {
      action: null,
      originalResourceId: null,
    },
    where: {
      id: {
        in: newResources.map((resource) => resource.id),
      },
    },
  });

  const newVersionResources = resources.filter(
    (resource) => resource.action === "newVersion",
  );

  await prisma.resource.updateMany({
    data: {
      action: null,
      originalResourceId: null,
    },
    where: {
      id: {
        in: newVersionResources.map((resource) => resource.id),
      },
    },
  });

  // Remove all deleted external relations
  const externalRelations = draftVersion.ExternalRelation;

  await prisma.externalRelation.deleteMany({
    where: {
      id: {
        in: externalRelations
          .filter((relation) => relation.action === "delete")
          .map((relation) => relation.id),
      },
    },
  });

  // Remove all deleted internal relations
  const internalRelations = draftVersion.InternalRelation;

  await prisma.internalRelation.deleteMany({
    where: {
      id: {
        in: internalRelations
          .filter((relation) => relation.action === "delete")
          .map((relation) => relation.id),
      },
    },
  });

  // publish the the version
  await prisma.version.update({
    data: {
      name: `${calver.inc(
        "yyyy.ww.minor",
        lastPublishedVersion?.name || "",
        "calendar.minor",
      )}`,
      collectionId,
      published: true,
      publishedOn: new Date(), // todo: update this as a utc datetime
    },
    where: {
      id: draftVersion.id,
    },
  });

  const { statusCode } = await collectionNewVersion(collectionId);

  if (statusCode !== 201) {
    throw createError({
      message: "Failed to create collection version",
      statusCode: 500,
    });
  }

  return {
    statusCode: 201,
    success: true,
  };
});
