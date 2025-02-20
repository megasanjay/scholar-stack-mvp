import { z } from "zod";
import { Prisma } from "@prisma/client";
import collectionMinEditorPermission from "~/server/utils/collection/collectionMinEditorPermission";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  await collectionMinEditorPermission(event);

  const bodySchema = z.array(
    z
      .object({
        affiliation: z.string(),
        creatorIndex: z.number(),
        creatorName: z.string(),
        familyName: z.string(),
        givenName: z.string().min(1),
        identifier: z.string(),
        identifierType: z.string(),
        nameType: z.union([z.literal("Personal"), z.literal("Organizational")]),
      })
      .refine((data) => {
        if (data.identifierType && !data.identifier) {
          return false;
        }

        if (data.identifier && !data.identifierType) {
          return false;
        }

        return true;
      }),
  );

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

  const { collectionid, workspaceid } = event.context.params as {
    collectionid: string;
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

  const creators = parsedBody.data.map((creator, index) => {
    return {
      ...creator,
      creatorIndex: index,
      creatorName: creator.familyName
        ? `${creator.familyName}, ${creator.givenName}`
        : creator.givenName,
    };
  });

  const json = creators as Prisma.JsonArray;

  // Get the draft version of the collection
  const version = await prisma.version.findFirst({
    where: {
      collectionId,
      published: false,
    },
  });

  if (!version) {
    throw createError({
      message: "Version not found",
      statusCode: 404,
    });
  }

  // Update the version with the new creators
  const updatedVersion = await prisma.version.update({
    data: {
      creators: json,
    },
    where: { id: version.id },
  });

  if (!updatedVersion) {
    throw createError({
      message: "Something went wrong",
      statusCode: 404,
    });
  }

  return {
    creators,
    statusCode: 200,
  };
});
