import { z } from "zod";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const bodySchema = z
    .object({
      external: z.array(
        z.object({
          id: z.string().optional(),
          resource_type: z.string(),
          target: z.string(),
          target_type: z.string(),
          type: z.string(),
        })
      ),
      internal: z.array(
        z.object({
          id: z.string().optional(),
          resource_type: z.string(),
          target_id: z.string(),
          type: z.string(),
        })
      ),
    })
    .strict();

  const body = await readBody(event);

  // Check if the body is present
  if (!body) {
    throw createError({
      message: "Missing required fields",
      statusCode: 400,
    });
  }

  // Check if the body is valid
  const parsedBody = bodySchema.safeParse(body);

  if (!parsedBody.success) {
    console.log(parsedBody.error);

    throw createError({
      message: "The provided parameters are invalid",
      statusCode: 400,
    });
  }

  await workspaceMinEditorPermission(event);

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

  const { external, internal } = parsedBody.data;

  // Check if the relation exists for the ones with an id and that the relation is part of the resource
  for (const relation of internal) {
    if (relation.target_id === resourceid) {
      throw createError({
        message: "Cannot create a relation to itself",
        statusCode: 400,
      });
    }

    if (relation.id) {
      const existingRelation = await prisma.stagingInternalRelation.findUnique({
        where: { id: relation.id, source_id: resourceid },
      });

      if (!existingRelation) {
        throw createError({
          message: "Relation not found",
          statusCode: 404,
        });
      }
    }
  }

  // Update the external relations
  for (const relation of external) {
    if (relation.id) {
      // Check if the relation exists for the ones with an id and that the relation is part of the resource
      const existingStagingRelation =
        await prisma.stagingExternalRelation.findUnique({
          where: {
            id: relation.id,
            source_id: resourceid,
          },
        });

      if (!existingStagingRelation) {
        throw createError({
          message: "Relation not found",
          statusCode: 404,
        });
      }

      // Get the original relation information
      if (existingStagingRelation.original_id) {
        const existingRelation = await prisma.externalRelation.findUnique({
          where: {
            id: existingStagingRelation.original_id,
          },
        });

        if (!existingRelation) {
          throw createError({
            message: "Relation not found",
            statusCode: 404,
          });
        }

        /**
         * * Check if the relation has changed
         * * If it has, add the update action
         * * If it hasn't, add the clone action
         */
        if (
          existingRelation.resource_type !== relation.resource_type ||
          existingRelation.type !== relation.type
        ) {
          await prisma.stagingExternalRelation.update({
            data: {
              action: "update",
              resource_type: relation.resource_type,
              type: relation.type,
            },
            where: {
              id: relation.id,
            },
          });
        } else {
          await prisma.stagingExternalRelation.update({
            data: {
              action: "clone",
              resource_type: relation.resource_type,
              type: relation.type,
            },
            where: {
              id: relation.id,
            },
          });
        }
      }
    } else {
      await prisma.stagingExternalRelation.create({
        data: {
          action: "create",
          resource_type: relation.resource_type,
          source_id: resourceid,
          target: relation.target,
          target_type: relation.target_type,
          type: relation.type,
        },
      });
    }
  }

  // Update the internal relations
  for (const relation of internal) {
    if (relation.id) {
      // todo: check diff and add update action
      if (relation.original_id) {
        // don't update the target for relations that are part of the published resource
        await prisma.stagingInternalRelation.update({
          data: {
            action: "update",
            resource_type: relation.resource_type,
            type: relation.type,
          },
          where: {
            id: relation.id,
          },
        });
      } else {
        await prisma.stagingInternalRelation.update({
          data: {
            mirror: false,
            resource_type: relation.resource_type,
            target_id: relation.target_id,
            type: relation.type,
          },
          where: {
            id: relation.id,
          },
        });
      }
    } else {
      await prisma.stagingInternalRelation.create({
        data: {
          action: "create",
          resource_type: relation.resource_type,
          source_id: resourceid,
          target_id: relation.target_id,
          type: relation.type,
        },
      });

      /**
       * TODO: mirror relations should be created on publish in this instance
       * * this way we can check and see if the resource exists in the collection
       * * as a well as map the relations to the correct resource
       */

      // Create the inverse relation
      // const relationType = relation.type;
      // const mirrorRelationType = mirrorRelation(relationType);

      // if (!mirrorRelationType) {
      //   continue;
      // }

      // check if the resource exists and if it is part of the collection
      // const targetResource = await prisma.resource.findUnique({
      //   where: {
      //     id: relation.target_id,
      //     Version: {
      //       some: {
      //         collection_id: collectionid,
      //       },
      //     },
      //   },
      // });

      // if (!targetResource) {
      //   throw createError({
      //     message: "Target resource not found",
      //     statusCode: 404,
      //   });
      // }

      // todo: check if the relation already exists
      // const relationExists = await prisma.stagingInternalRelation.findFirst({
      //   where: {
      //     source_id: relation.target_id,
      //     target_id: resourceid,
      //     type: mirrorRelationType,
      //   },
      // });

      // Add the inverse relation
      // await prisma.stagingInternalRelation.create({
      //   data: {
      //     mirror: true,
      //     source_id: relation.target_id,
      //     target_id: resourceid,
      //     type: mirrorRelationType,
      //   },
      // });
    }
  }

  // Organize the relations to return

  // get all the relations for the resource
  const internalRelations = await prisma.stagingInternalRelation.findMany({
    orderBy: {
      created: "asc",
    },
    where: {
      source_id: resourceid,
    },
  });

  const externalRelations = await prisma.stagingExternalRelation.findMany({
    orderBy: {
      created: "asc",
    },
    where: {
      source_id: resourceid,
    },
  });

  await touchCollection(collectionid);

  return {
    message: "Relations updated",
    relations: {
      external: externalRelations,
      internal: internalRelations,
    },
    statusCode: 200,
  };
});
