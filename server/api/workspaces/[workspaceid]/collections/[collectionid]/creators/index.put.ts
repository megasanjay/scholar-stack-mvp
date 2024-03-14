import { z } from "zod";
import { Prisma } from "@prisma/client";

export default defineEventHandler(async (event) => {
  await protectRoute(event);
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

  const collection = await prisma.collection.findUnique({
    where: { id: collectionid, workspace_id: workspaceid },
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

  const updatedCollection = await prisma.collection.update({
    data: {
      creators: json,
    },
    where: { id: collectionid },
  });

  if (!updatedCollection) {
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
