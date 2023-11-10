import { serverSupabaseUser } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  const user = await serverSupabaseUser(event);

  const workspaces = await prisma.access.findMany({
    select: {
      workspace: {
        select: {
          id: true,
          title: true,
          created: true,
          description: true,
          personal: true,
        },
      },
    },
    where: {
      user_id: user?.id,
    },
  });

  return workspaces.map((workspace) => workspace.workspace);
});
