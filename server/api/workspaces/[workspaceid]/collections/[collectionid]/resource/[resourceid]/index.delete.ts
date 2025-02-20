import collectionMinEditorPermission from "~/server/utils/collection/collectionMinEditorPermission";
import touchCollection from "~/server/utils/collection/touchCollection";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await collectionMinEditorPermission(event);

  const { collectionid, resourceid, workspaceid } = event.context.params as {
    collectionid: string;
    resourceid: string;
    workspaceid: string;
  };

  const collectionId = parseInt(collectionid);

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId, workspaceId: workspaceid },
  });

  if (!collection) {
    throw createError({
      statusCode: 404,
      statusMessage: "Collection not found",
    });
  }

  const draftVersion = await prisma.version.findFirst({
    where: {
      collectionId,
      published: false,
    },
  });

  if (!draftVersion) {
    throw createError({
      statusCode: 404,
      statusMessage: "Draft version not found",
    });
  }

  // Check if the resource exists in the draft version
  const resource = await prisma.resource.findUnique({
    where: { id: resourceid, versionId: draftVersion.id },
  });

  if (!resource) {
    throw createError({
      statusCode: 404,
      statusMessage: "Resource not found",
    });
  }

  /**
   * If the resource is newVersion, we should restore the oldVersion
   * and delete the newVersion
   */
  if (resource.action === "newVersion" && resource.backLinkId) {
    const oldVersionOfResourceInCurrentDraft = await prisma.resource.findFirst({
      where: {
        id: resource.backLinkId,
      },
    });

    if (!oldVersionOfResourceInCurrentDraft) {
      throw createError({
        statusCode: 404,
        statusMessage: "Old version of resource not found",
      });
    }

    if (oldVersionOfResourceInCurrentDraft.originalResourceId) {
      const oldPublishedVersionOfResource = await prisma.resource.findUnique({
        where: {
          id: oldVersionOfResourceInCurrentDraft.originalResourceId,
        },
      });

      if (!oldPublishedVersionOfResource) {
        throw createError({
          statusCode: 404,
          statusMessage: "Old published version of resource not found",
        });
      }

      // compare the title, description, icon, version_label
      // if they are the same, we can mark the oldVersion as cloned
      // if they are different, we need to add updated to the old version resource

      if (
        oldPublishedVersionOfResource.title !==
          oldVersionOfResourceInCurrentDraft.title ||
        oldPublishedVersionOfResource.description !==
          oldVersionOfResourceInCurrentDraft.description ||
        oldPublishedVersionOfResource.resourceType !==
          oldVersionOfResourceInCurrentDraft.resourceType ||
        oldPublishedVersionOfResource.versionLabel !==
          oldVersionOfResourceInCurrentDraft.versionLabel
      ) {
        // restore the old version
        await prisma.resource.update({
          data: {
            action: "update",
          },
          where: { id: resource.backLinkId },
        });
      } else {
        // mark the old version as cloned
        await prisma.resource.update({
          data: {
            action: "clone",
          },
          where: { id: resource.backLinkId },
        });
      }

      // delete the new version
      await prisma.resource.delete({
        where: { id: resourceid },
      });

      await touchCollection(collectionId);

      return {
        statusCode: 200,
        statusMessage: "Resource removed",
      };
    }
  } else {
    // If the resource is new, we can delete it
    if (resource.action === "create") {
      await prisma.resource.delete({
        where: { id: resourceid },
      });

      await touchCollection(collectionId);

      return {
        statusCode: 200,
        statusMessage: "Resource removed",
      };
    }

    // Mark the resource as deleted
    await prisma.resource.update({
      data: {
        action: "delete",
      },
      where: { id: resourceid },
    });
  }

  return {
    statusCode: 200,
    statusMessage: "Resource removed",
  };
});
