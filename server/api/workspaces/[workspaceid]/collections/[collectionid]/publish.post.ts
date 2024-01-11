import { nanoid } from "nanoid";
import calver from "calver";

export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await workspaceMinAdminPermission(event);

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
    workspaceid: string;
  };

  const collection = await prisma.collection.findUnique({
    where: {
      id: collectionid,
      workspace_id: workspaceid,
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
      Resources: true,
    },
    where: {
      collection_id: collectionid,
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
      published_on: "desc",
    },
    where: {
      collection_id: collectionid,
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

  // create a new version
  const newVersion = await prisma.version.create({
    data: {
      name: `v${calver.inc(
        "yyyy.ww.minor",
        lastPublishedVersion?.name || "",
        "calendar.minor"
      )}`,
      changelog: draftVersion.changelog,
      collection_id: collectionid,
      identifier: nanoid(),
    },
  });

  const stagingResources = draftVersion.Resources;

  // Adda a new_resource_id field to catch created resources
  const resources = stagingResources.map((resource) => {
    return {
      ...resource,
      new_resource_id: "",
    };
  });

  /**
   * ! Start the resource mapping process
   *
   * * If the resource has the original_resource_id field, it means it is an existing resource
   * * * If the action is update, update the original resource with the new data
   * * * If the action is newVersion, create a new resource with the new data and connect it to the new version
   * * * If the action is delete or oldVersion, do nothing (effectively deleting the resource)
   * * * If the action is clone, connect the original resource to the new version
   *     - This also means that the original resource was unchanged, so we don't need to do anything
   *
   * * If the resource does not have the original_resource_id field, it means it is a new resource
   * * * If the action is create, create a new resource with the new data and connect it to the new version
   */

  for (const resource of resources) {
    if (resource.original_resource_id) {
      if (resource.action === "update") {
        await prisma.resource.update({
          data: {
            title: resource.title,
            description: resource.description,
            icon: resource.icon,
            Version: {
              connect: {
                id: newVersion.id,
              },
            },
            version_label: resource.version_label,
          },
          where: {
            id: resource.original_resource_id,
          },
        });
      }

      if (resource.action === "newVersion") {
        const newResource = await prisma.resource.create({
          data: {
            title: resource.title,
            back_link_id: resource.original_resource_id,
            description: resource.description,
            filled_in: true,
            icon: resource.icon,
            target: resource.target,
            type: resource.type,
            Version: {
              connect: {
                id: newVersion.id,
              },
            },
            version_label: resource.version_label,
          },
        });

        resource.new_resource_id = newResource.id;
      }

      if (resource.action === "clone") {
        await prisma.version.update({
          data: {
            Resources: {
              connect: {
                id: resource.original_resource_id,
              },
            },
          },
          where: {
            id: newVersion.id,
          },
        });
      }

      if (resource.action === "delete" || resource.action === "oldVersion") {
        // don't do anything
        console.log("delete");
      }
    } else {
      console.log("create");

      // these are for new resources
      if (resource.action === "create") {
        const newResource = await prisma.resource.create({
          data: {
            title: resource.title,
            description: resource.description,
            filled_in: true,
            icon: resource.icon,
            target: resource.target,
            type: resource.type,
            Version: {
              connect: {
                id: newVersion.id,
              },
            },
            version_label: resource.version_label,
          },
        });

        resource.new_resource_id = newResource.id;
      }
    }

    const stagingExternalRelations =
      await prisma.stagingExternalRelation.findMany({
        where: {
          source_id: resource.id,
        },
      });

    /**
     * * Keep the external relations that have a create or update action
     * * If the action is delete, keep it only if it has an original_id field
     */
    const externalRelations = stagingExternalRelations.filter(
      (externalRelation) =>
        externalRelation.action !== "delete" ||
        (externalRelation.action === "delete" && externalRelation.original_id)
    );

    /**
     * ! Start the external relation mapping process
     *
     * * If the external relation has the original_id field, it means it is an existing external relation
     * * * If the action is update, update the original external relation with the new data
     * * * If the action is create, create a new external relation with the new data and connect it to the new resource
     * * * If the action is delete, delete the original external relation
     */

    for (const externalRelation of externalRelations) {
      if (externalRelation.original_id) {
        if (externalRelation.action === "update") {
          await prisma.externalRelation.update({
            data: {
              resource_type: externalRelation.resource_type,
              type: externalRelation.type,
            },
            where: {
              id: externalRelation.original_id,
            },
          });
        }

        /**
         * ? Are external relations versioned?
         * ? Deleting an external relation from a resource will delete it from the resource across all versions. Creating or newversion resources will bypass this but the conversation still needs to be had.
         */
        if (externalRelation.action === "delete") {
          await prisma.externalRelation.delete({
            where: {
              id: externalRelation.original_id,
            },
          });
        }
      }

      /**
       * * original_resource_id is used for cloned resources
       * * new_resource_id is used for new/newVersion resources
       */
      if (externalRelation.action === "create") {
        await prisma.externalRelation.create({
          data: {
            resource_type: externalRelation.resource_type,
            source_id:
              resource.original_resource_id || resource.new_resource_id,
            target: externalRelation.target,
            target_type: externalRelation.target_type,
            type: externalRelation.type,
          },
        });
      }
    }
  }

  /**
   * * Loop through the resources again to map the internal relations
   * * This is done in a separate loop because we need to make sure any target resources are created first
   */

  for (const resource of resources) {
    const stagingInternalRelations =
      await prisma.stagingInternalRelation.findMany({
        where: {
          source_id: resource.id,
        },
      });

    /**
     * * Keep the internal relations that have a create or update action
     * * If the action is delete, keep it only if it has an original_id field
     */
    const internalRelations = stagingInternalRelations.filter(
      (internalRelation) =>
        internalRelation.action !== "delete" ||
        (internalRelation.action === "delete" && internalRelation.original_id)
    );

    /**
     * ! Start the internal relation mapping process
     *
     * * If the internal relation has the original_id field, it means it is an existing internal relation
     * * * If the action is update, update the original internal relation with the new data
     * * * If the action is create, create a new internal relation with the new data and connect it to the new resource
     * * * If the action is delete, delete the original internal relation
     */

    for (const internalRelation of internalRelations) {
      if (
        internalRelation.action === "update" &&
        internalRelation.original_id
      ) {
        await prisma.internalRelation.update({
          data: {
            resource_type: internalRelation.resource_type,
            type: internalRelation.type,
          },
          where: {
            id: internalRelation.original_id,
          },
        });
      }

      if (internalRelation.action === "create") {
        const targetResourceInCurrentVersion = resources.find(
          (stagingResource) => stagingResource.id === internalRelation.target_id
        );

        if (targetResourceInCurrentVersion?.action === "delete") {
          /**
           * * If the target resource is deleted, we cannot create an internal relation to it
           * ? Should we throw an error here?
           * ? Should we delete the internal relation?
           * ? Should we ignore it?
           */
          throw createError({
            message: "Cannot create an internal relation to a deleted resource",
            statusCode: 400,
          });
        }

        await prisma.internalRelation.create({
          data: {
            resource_type: internalRelation.resource_type,
            source_id:
              resource.original_resource_id || resource.new_resource_id,
            target_id:
              targetResourceInCurrentVersion?.original_resource_id ||
              targetResourceInCurrentVersion?.new_resource_id ||
              internalRelation.target_id,
            type: internalRelation.type,
          },
        });
      }

      if (
        internalRelation.action === "delete" &&
        internalRelation.original_id
      ) {
        await prisma.internalRelation.delete({
          where: {
            id: internalRelation.original_id,
          },
        });
      }
    }
  }

  // publish the the version
  await prisma.version.update({
    data: {
      published: true,
      published_on: new Date(),
    },
    where: {
      id: newVersion.id,
    },
  });

  // clean up the staging items
  for (const resource of stagingResources) {
    await prisma.stagingExternalRelation.deleteMany({
      where: {
        source_id: resource.id,
      },
    });

    await prisma.stagingInternalRelation.deleteMany({
      where: {
        source_id: resource.id,
      },
    });

    await prisma.stagingInternalRelation.deleteMany({
      where: {
        target_id: resource.id,
      },
    });

    await prisma.resource.delete({
      where: {
        id: resource.id,
      },
    });
  }

  await prisma.version.delete({
    where: {
      id: draftVersion.id,
    },
  });

  return {
    statusCode: 201,
    success: true,
  };
});
