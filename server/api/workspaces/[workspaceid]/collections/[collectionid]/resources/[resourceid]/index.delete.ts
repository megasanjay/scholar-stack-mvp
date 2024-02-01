export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await collectionMinEditorPermission(event);

  const { collectionid, resourceid, workspaceid } = event.context.params as {
    collectionid: string;
    resourceid: string;
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

  // Check if the resource exists
  const resource = await prisma.resource.findUnique({
    where: { id: resourceid },
  });

  if (!resource) {
    throw createError({
      message: "Resource not found",
      statusCode: 404,
    });
  }

  /**
   * If the resource is newVersion, we should restore the oldVersion
   * and delete the newVersion
   */
  if (resource.action === "newVersion" && resource.back_link_id) {
    const oldVersionOfResourceInCurrentDraft = await prisma.resource.findFirst({
      where: {
        id: resource.back_link_id,
        Version: {
          some: {
            id: draftVersion.id,
          },
        },
      },
    });

    if (!oldVersionOfResourceInCurrentDraft) {
      throw createError({
        message: "Old version of resource not found",
        statusCode: 404,
      });
    }

    if (oldVersionOfResourceInCurrentDraft.original_resource_id) {
      const oldPublishedVersionOfResource = await prisma.resource.findFirst({
        where: {
          id: oldVersionOfResourceInCurrentDraft.original_resource_id,
          Version: {
            some: {
              collection_id: collectionid,
              published: true,
            },
          },
        },
      });

      if (!oldPublishedVersionOfResource) {
        throw createError({
          message: "Old published version of resource not found",
          statusCode: 404,
        });
      }

      // compare the title, description, icon, version_label
      // if they are the same, we can just delete the new version
      // if they are different, we need to restore the old version

      if (
        oldPublishedVersionOfResource.title !==
          oldVersionOfResourceInCurrentDraft.title ||
        oldPublishedVersionOfResource.description !==
          oldVersionOfResourceInCurrentDraft.description ||
        oldPublishedVersionOfResource.icon !==
          oldVersionOfResourceInCurrentDraft.icon ||
        oldPublishedVersionOfResource.version_label !==
          oldVersionOfResourceInCurrentDraft.version_label
      ) {
        // restore the old version
        await prisma.resource.update({
          data: {
            action: "update",
          },
          where: { id: resource.back_link_id },
        });
      } else {
        // mark the old version as cloned
        await prisma.resource.update({
          data: {
            action: "clone",
          },
          where: { id: resource.back_link_id },
        });
      }
    }

    // delete the new version
    await prisma.resource.delete({
      where: { id: resourceid },
    });

    await touchCollection(collectionid);

    return {
      message: "Resource removed",
      statusCode: 200,
    };
  }

  // Check if the resource is part of any published versions
  if (resource.original_resource_id) {
    const publishedResource = await prisma.resource.findFirst({
      where: {
        id: resource.original_resource_id,
        Version: {
          some: {
            published: true,
          },
        },
      },
    });

    if (publishedResource) {
      // If the resource is part of a published version, we can't delete it
      // We should mark the resource as deleted from the draft version instead

      const draftVersion = await prisma.version.findFirst({
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

      // mark the resource as deleted
      await prisma.resource.update({
        data: {
          action: "delete",
        },
        where: { id: resourceid },
      });
    } else {
      // Delete the resource
      await prisma.resource.delete({
        where: { id: resourceid },
      });
    }
  } else {
    // todo: this shouldn't be possible i think. Anything with an original_resource_id should be part of a published version
    // will need to check this later
    // Delete the resource
    await prisma.resource.delete({
      where: { id: resourceid },
    });
  }

  // todo: remove relations upon deletion
  // Added cascade delete to the database. This should be handled by the database instead.
  // check if this works though

  await touchCollection(collectionid);

  return {
    message: "Resource removed",
    statusCode: 200,
  };
});
