import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  // todo: remove user check
  await protectRoute(event);

  const { identifier } = event.context.params as {
    identifier: string;
  };

  // Only collection identifiers are allowed
  const regex = /^[c][a-zA-Z0-9-_]{8,9}$/;

  if (!regex.test(identifier)) {
    throw createError({
      message: "Invalid identifier",
      statusCode: 400,
    });
  }

  const user = await serverSupabaseUser(event);

  const userId = user?.id as string;

  const collection = await prisma.collection.findUnique({
    where: { identifier, private: false },
  });

  if (!collection) {
    throw createError({
      message: "Collection not found",
      statusCode: 404,
    });
  }

  const returnData = {
    starCount: 0,
    starred: false,
    statusCode: 200,
  };

  const starredData = await prisma.starred.findFirst({
    where: {
      collection_id: collection.id,
      user_id: userId,
    },
  });

  if (starredData) {
    returnData.starred = true;
  }

  const count = await prisma.starred.count({
    where: {
      collection_id: collection.id,
    },
  });

  returnData.starCount = count;

  return returnData;
});
