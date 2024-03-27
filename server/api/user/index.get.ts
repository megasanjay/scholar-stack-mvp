import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const user = await serverSupabaseUser(event);
  const userid = user?.id as string;

  const userDetails = await prisma.user.findUnique({
    where: {
      id: userid,
    },
  });

  if (!userDetails) {
    throw createError({
      message: "User not found",
      status: 404,
    });
  }

  return userDetails;
});
