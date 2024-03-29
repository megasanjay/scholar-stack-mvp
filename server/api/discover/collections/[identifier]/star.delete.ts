import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
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

  const starred = await prisma.starred.findFirst({
    where: {
      collection_id: collection.id,
      user_id: userId,
    },
  });

  if (!starred) {
    throw createError({
      message: "Star not found",
      statusCode: 404,
    });
  }

  await prisma.starred.delete({
    where: {
      user_id_collection_id: {
        collection_id: collection.id,
        user_id: userId,
      },
    },
  });

  return {
    statusCode: 200,
  };
});
