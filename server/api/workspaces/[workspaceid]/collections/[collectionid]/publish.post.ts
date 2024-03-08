import calver from "calver";
import semverClean from "semver/functions/clean";

export default defineEventHandler(async (event) => {
  await protectRoute(event);
  await collectionMinAdminPermission(event);

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
          resource_type: updatedResource.resource_type,
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
    const externalRelations = await prisma.externalRelation.findMany({
      where: {
        source_id: resource.id,
      },
    });

    const clonedExternalRelations = externalRelations.filter(
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

    const updatedExternalRelations = externalRelations.filter(
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

    const deletedExternalRelations = externalRelations.filter(
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

    const newExternalRelations = externalRelations.filter(
      (externalRelation) => externalRelation.action === "create",
    );

    for (const newExternalRelation of newExternalRelations) {
      /**
       * new external relations can come from a new resource or a pre-existing resource.
       */
      if (resource.original_resource_id) {
        /**
         * For a pre-existing resource, the new external relations needs to be created and linked to the original resource.
         * Resources that have a cloned/updated action will have a original_resource_id
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

  for (const resource of stagingResources) {
    const internalRelations = await prisma.internalRelation.findMany({
      where: {
        source_id: resource.id,
      },
    });

    const clonedInternalRelations = internalRelations.filter(
      (internalRelation) => internalRelation.action === "clone",
    );

    for (const clonedInternalRelation of clonedInternalRelations) {
      if (clonedInternalRelation.original_relation_id) {
        /**
         * cloned internal relations come from a prexisting resource and relation. We are linking the original relation to the new version. The resource relation is not changed.
         */
        await prisma.internalRelation.update({
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
            id: clonedInternalRelation.original_relation_id,
          },
        });

        // delete the cloned staging internal relation
        await prisma.internalRelation.delete({
          where: {
            id: clonedInternalRelation.id,
          },
        });
      }
    }

    const updatedInternalRelations = internalRelations.filter(
      (internalRelation) => internalRelation.action === "update",
    );

    for (const updatedInternalRelation of updatedInternalRelations) {
      if (updatedInternalRelation.original_relation_id) {
        /**
         * updated internal relations come from a prexisting resource and relation. We are updating the original relation with the new data.
         */
        await prisma.internalRelation.update({
          data: {
            action: null,
            original_relation_id: null,
            resource_type: updatedInternalRelation.resource_type,
            type: updatedInternalRelation.type,
            Version: {
              connect: {
                id: draftVersion.id,
              },
            },
          },
          where: {
            id: updatedInternalRelation.original_relation_id,
          },
        });

        // delete the updated staging internal relation
        await prisma.internalRelation.delete({
          where: {
            id: updatedInternalRelation.id,
          },
        });
      }
    }

    const deletedInternalRelations = internalRelations.filter(
      (internalRelation) => internalRelation.action === "delete",
    );

    for (const deletedInternalRelation of deletedInternalRelations) {
      /**
       * The original relation is linked to the original resource. We are removing the staging relation, which should remove the relation from the new version.
       */
      await prisma.internalRelation.delete({
        where: {
          id: deletedInternalRelation.id,
        },
      });
    }

    const newInternalRelations = internalRelations.filter(
      (internalRelation) => internalRelation.action === "create",
    );

    for (const newInternalRelation of newInternalRelations) {
      /**
       * new internal relations can come from a new resource or a pre-existing resource.
       */
      if (resource.original_resource_id) {
        /**
         * For a pre-existing resource, the new internal relations needs to be created and linked to the original resource.
         * Resources that have a cloned/updated action will have a original_resource_id
         * Any target resources that are cloned/updated shouldn't be an issue since they are not selectable in the UI. Will need to confirm this for the API.
         */
        await prisma.internalRelation.create({
          data: {
            action: null,
            resource_type: newInternalRelation.resource_type,
            source_id: resource.original_resource_id,
            target_id: newInternalRelation.target_id,
            type: newInternalRelation.type,
            Version: {
              connect: {
                id: draftVersion.id,
              },
            },
          },
        });

        // delete the new staging internal relation
        await prisma.internalRelation.delete({
          where: {
            id: newInternalRelation.id,
          },
        });
      } else {
        /**
         * For a new resource, the new internal relation already exists. We just need to remove the action and original_relation_id fields.
         */
        await prisma.internalRelation.update({
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
            id: newInternalRelation.id,
          },
        });
      }
    }
  }

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

  return {
    statusCode: 201,
    success: true,
  };
});
