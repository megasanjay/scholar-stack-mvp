import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const user = await serverSupabaseUser(event);
  const userid = user?.id as string;

  const starredCollections = await prisma.starred.findMany({
    include: {
      collection: true,
    },
    orderBy: {
      created: "desc",
    },
    where: {
      user_id: userid,
    },
  });

  if (!starredCollections) {
    throw createError({
      message: "Starred collections not found",
      status: 404,
    });
  }

  return starredCollections;
});
