import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
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
    statusCode: 0,
  };

  const count = await prisma.starred.count({
    where: {
      collection_id: collection.id,
    },
  });

  returnData.starCount = count;
  returnData.statusCode = 200;

  const user = await serverSupabaseUser(event);

  if (user) {
    const userId = user?.id as string;

    const starredData = await prisma.starred.findFirst({
      where: {
        collection_id: collection.id,
        user_id: userId,
      },
    });

    if (starredData) {
      returnData.starred = true;
    }
  }

  return returnData;
});
