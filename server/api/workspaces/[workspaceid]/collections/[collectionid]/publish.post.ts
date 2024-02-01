import calver from "calver";
import semverClean from "semver/functions/clean";

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
  // const newVersion = await prisma.version.create({
  //   data: {
  //     name: `v${calver.inc(
  //       "yyyy.ww.minor",
  //       lastPublishedVersion?.name || "",
  //       "calendar.minor"
  //     )}`,
  //     changelog: draftVersion.changelog,
  //     collection_id: collectionid,
  //     identifier: nanoid(),
  //   },
  // });

  const resources = draftVersion.Resources;

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

  const clonedResources = resources.filter(
    (resource) => resource.action === "clone",
  );

  for (const clonedResource of clonedResources) {
    if (clonedResource.original_resource_id) {
      await prisma.version.update({
        data: {
          Resources: {
            connect: {
              id: clonedResource.original_resource_id,
            },
          },
        },
        where: {
          id: draftVersion.id,
        },
      });
    }
  }

  const updatedResources = resources.filter(
    (resource) => resource.action === "update",
  );

  for (const updatedResource of updatedResources) {
    if (updatedResource.original_resource_id) {
      await prisma.resource.update({
        data: {
          title: updatedResource.title,
          description: updatedResource.description,
          icon: updatedResource.icon,
          Version: {
            connect: {
              id: draftVersion.id,
            },
          },
          version_label: updatedResource.version_label,
        },
        where: {
          id: updatedResource.original_resource_id,
        },
      });
    }
  }

  const deletedResources = resources.filter(
    (resource) => resource.action === "delete",
  );

  for (const deletedResource of deletedResources) {
    // remove the deleted staging resource
    await prisma.resource.delete({
      where: {
        id: deletedResource.id,
      },
    });
  }

  const newVersionResources = resources.filter(
    (resource) => resource.action === "newVersion",
  );

  for (const newVersionResource of newVersionResources) {
    if (newVersionResource.back_link_id) {
      const oldResource = await prisma.resource.findUnique({
        where: {
          id: newVersionResource.back_link_id,
        },
      });

      await prisma.resource.update({
        data: {
          action: null,
          back_link_id: oldResource?.original_resource_id,
          filled_in: true,
          original_resource_id: null,
        },
        where: {
          id: newVersionResource.id,
        },
      });
    }
  }

  const oldVersionResources = resources.filter(
    (resource) => resource.action === "oldVersion",
  );

  for (const oldVersionResource of oldVersionResources) {
    // remove the old version staging resource
    await prisma.resource.delete({
      where: {
        id: oldVersionResource.id,
      },
    });
  }

  const newResources = resources.filter(
    (resource) => resource.action === "create",
  );

  for (const newResource of newResources) {
    await prisma.resource.update({
      data: {
        action: null,
        filled_in: true,
        original_resource_id: null,
      },
      where: {
        id: newResource.id,
      },
    });
  }

  // todo: resources done for the version. 01/15/24

  const updatedDraftVersion = await prisma.version.findFirst({
    include: {
      Resources: true,
    },
    where: {
      id: draftVersion.id,
    },
  });

  const stagingResources = updatedDraftVersion?.Resources || [];

  for (const resource of stagingResources) {
    const externalRelation = await prisma.externalRelation.findMany({
      where: {
        source_id: resource.id,
      },
    });

    const clonedExternalRelations = externalRelation.filter(
      (externalRelation) => externalRelation.action === "clone",
    );

    for (const clonedExternalRelation of clonedExternalRelations) {
      if (clonedExternalRelation.original_relation_id) {
        /**
         * cloned external relations come from a prexisting resource and relation. We are linking the original relation to the new version. The resource relation is not changed.
         */
        await prisma.externalRelation.update({
          data: {
            action: null,
            original_relation_id: null,
            Version: {
              connect: {
                id: draftVersion.id,
              },
            },
          },
          where: {
            id: clonedExternalRelation.original_relation_id,
          },
        });

        // delete the cloned staging external relation
        await prisma.externalRelation.delete({
          where: {
            id: clonedExternalRelation.id,
          },
        });
      }
    }

    const updatedExternalRelations = externalRelation.filter(
      (externalRelation) => externalRelation.action === "update",
    );

    for (const updatedExternalRelation of updatedExternalRelations) {
      if (updatedExternalRelation.original_relation_id) {
        /**
         * updated external relations come from a prexisting resource and relation. We are updating the original relation with the new data.
         */
        await prisma.externalRelation.update({
          data: {
            action: null,
            original_relation_id: null,
            resource_type: updatedExternalRelation.resource_type,
            type: updatedExternalRelation.type,
            Version: {
              connect: {
                id: draftVersion.id,
              },
            },
          },
          where: {
            id: updatedExternalRelation.original_relation_id,
          },
        });

        // delete the updated staging external relation
        await prisma.externalRelation.delete({
          where: {
            id: updatedExternalRelation.id,
          },
        });
      }
    }

    const deletedExternalRelations = externalRelation.filter(
      (externalRelation) => externalRelation.action === "delete",
    );

    for (const deletedExternalRelation of deletedExternalRelations) {
      /**
       * The original relation is linked to the original resource. We are removing the staging relation, which should remove the relation from the new version.
       */
      await prisma.externalRelation.delete({
        where: {
          id: deletedExternalRelation.id,
        },
      });
    }

    const newExternalRelations = externalRelation.filter(
      (externalRelation) => externalRelation.action === "create",
    );

    for (const newExternalRelation of newExternalRelations) {
      /**
       * new external relations can come from a new resource or a pre-existing resource.
       */
      if (resource.original_resource_id) {
        /**
         * For a pre-existing resource, the new external relations needs to be created and linked to the original resource.
         */
        await prisma.externalRelation.create({
          data: {
            action: null,
            resource_type: newExternalRelation.resource_type,
            source_id: resource.original_resource_id,
            target: newExternalRelation.target,
            target_type: newExternalRelation.target_type,
            type: newExternalRelation.type,
            Version: {
              connect: {
                id: draftVersion.id,
              },
            },
          },
        });

        // delete the new staging external relation
        await prisma.externalRelation.delete({
          where: {
            id: newExternalRelation.id,
          },
        });
      } else {
        /**
         * For a new resource, the new external relation already exists. We just need to remove the action and original_relation_id fields.
         */
        await prisma.externalRelation.update({
          data: {
            action: null,
            original_relation_id: null,
            Version: {
              connect: {
                id: draftVersion.id,
              },
            },
          },
          where: {
            id: newExternalRelation.id,
          },
        });
      }
    }
  }

  // for (const resource of resources) {
  //   const stagingExternalRelations =
  //     await prisma.stagingExternalRelation.findMany({
  //       where: {
  //         source_id: resource.id,
  //       },
  //     });

  //   /**
  //    * * Keep the external relations that have a create or update action
  //    * * If the action is delete, keep it only if it has an original_id field
  //    */
  //   const externalRelations = stagingExternalRelations.filter(
  //     (externalRelation) =>
  //       externalRelation.action !== "delete" ||
  //       (externalRelation.action === "delete" && externalRelation.original_id)
  //   );

  //   /**
  //    * ! Start the external relation mapping process
  //    *
  //    * * If the external relation has the original_id field, it means it is an existing external relation
  //    * * * If the action is update, update the original external relation with the new data
  //    * * * If the action is create, create a new external relation with the new data and connect it to the new resource
  //    * * * If the action is delete, delete the original external relation
  //    */

  //   for (const externalRelation of externalRelations) {
  //     if (externalRelation.original_id) {
  //       if (externalRelation.action === "update") {
  //         await prisma.externalRelation.update({
  //           data: {
  //             resource_type: externalRelation.resource_type,
  //             type: externalRelation.type,
  //           },
  //           where: {
  //             id: externalRelation.original_id,
  //           },
  //         });
  //       }

  //       /**
  //        * ? Are external relations versioned?
  //        * ? Deleting an external relation from a resource will delete it from the resource across all versions. Creating or newversion resources will bypass this but the conversation still needs to be had.
  //        */
  //       if (externalRelation.action === "delete") {
  //         await prisma.externalRelation.delete({
  //           where: {
  //             id: externalRelation.original_id,
  //           },
  //         });
  //       }
  //     }

  //     /**
  //      * * original_resource_id is used for cloned resources
  //      * * new_resource_id is used for new/newVersion resources
  //      */
  //     if (externalRelation.action === "create") {
  //       await prisma.externalRelation.create({
  //         data: {
  //           resource_type: externalRelation.resource_type,
  //           source_id:
  //             resource.original_resource_id || resource.new_resource_id,
  //           target: externalRelation.target,
  //           target_type: externalRelation.target_type,
  //           type: externalRelation.type,
  //         },
  //       });
  //     }
  //   }
  // }

  /**
   * * Loop through the resources again to map the internal relations
   * * This is done in a separate loop because we need to make sure any target resources are created first
   */

  // for (const resource of resources) {
  //   const stagingInternalRelations =
  //     await prisma.stagingInternalRelation.findMany({
  //       where: {
  //         source_id: resource.id,
  //       },
  //     });

  //   /**
  //    * * Keep the internal relations that have a create or update action
  //    * * If the action is delete, keep it only if it has an original_id field
  //    */
  //   const internalRelations = stagingInternalRelations.filter(
  //     (internalRelation) =>
  //       internalRelation.action !== "delete" ||
  //       (internalRelation.action === "delete" && internalRelation.original_id)
  //   );

  //   /**
  //    * ! Start the internal relation mapping process
  //    *
  //    * * If the internal relation has the original_id field, it means it is an existing internal relation
  //    * * * If the action is update, update the original internal relation with the new data
  //    * * * If the action is create, create a new internal relation with the new data and connect it to the new resource
  //    * * * If the action is delete, delete the original internal relation
  //    */

  //   for (const internalRelation of internalRelations) {
  //     if (
  //       internalRelation.action === "update" &&
  //       internalRelation.original_id
  //     ) {
  //       await prisma.internalRelation.update({
  //         data: {
  //           resource_type: internalRelation.resource_type,
  //           type: internalRelation.type,
  //         },
  //         where: {
  //           id: internalRelation.original_id,
  //         },
  //       });
  //     }

  //     if (internalRelation.action === "create") {
  //       const targetResourceInCurrentVersion = resources.find(
  //         (stagingResource) => stagingResource.id === internalRelation.target_id
  //       );

  //       if (targetResourceInCurrentVersion?.action === "delete") {
  //         /**
  //          * * If the target resource is deleted, we cannot create an internal relation to it
  //          * ? Should we throw an error here?
  //          * ? Should we delete the internal relation?
  //          * ? Should we ignore it?
  //          */
  //         throw createError({
  //           message: "Cannot create an internal relation to a deleted resource",
  //           statusCode: 400,
  //         });
  //       }

  //       await prisma.internalRelation.create({
  //         data: {
  //           resource_type: internalRelation.resource_type,
  //           source_id:
  //             resource.original_resource_id || resource.new_resource_id,
  //           target_id:
  //             targetResourceInCurrentVersion?.original_resource_id ||
  //             targetResourceInCurrentVersion?.new_resource_id ||
  //             internalRelation.target_id,
  //           type: internalRelation.type,
  //         },
  //       });
  //     }

  //     if (
  //       internalRelation.action === "delete" &&
  //       internalRelation.original_id
  //     ) {
  //       await prisma.internalRelation.delete({
  //         where: {
  //           id: internalRelation.original_id,
  //         },
  //       });
  //     }
  //   }
  // }

  /**
   * Delete the cloned resources after the relations have been mapped
   */
  for (const clonedResource of clonedResources) {
    // delete the cloned staging resource
    await prisma.resource.delete({
      where: {
        id: clonedResource.id,
      },
    });
  }

  /**
   * Delete the updated resources after the relations have been mapped
   */
  for (const updatedResource of updatedResources) {
    // delete the updated staging resource
    await prisma.resource.delete({
      where: {
        id: updatedResource.id,
      },
    });
  }

  // publish the the version
  await prisma.version.update({
    data: {
      name: `v${calver.inc(
        "yyyy.ww.minor",
        lastPublishedVersion?.name
          ? semverClean(lastPublishedVersion?.name)
          : "",
        "calendar.minor",
      )}`,
      collection_id: collectionid,
      published: true,
      published_on: new Date(), // todo: update this as a utc datetime
    },
    where: {
      id: draftVersion.id,
    },
  });

  // clean up the staging items
  // for (const resource of stagingResources) {
  //   await prisma.stagingExternalRelation.deleteMany({
  //     where: {
  //       source_id: resource.id,
  //     },
  //   });

  //   await prisma.stagingInternalRelation.deleteMany({
  //     where: {
  //       source_id: resource.id,
  //     },
  //   });

  //   await prisma.stagingInternalRelation.deleteMany({
  //     where: {
  //       target_id: resource.id,
  //     },
  //   });

  //   await prisma.resource.delete({
  //     where: {
  //       id: resource.id,
  //     },
  //   });
  // }

  return {
    statusCode: 201,
    success: true,
  };
});
