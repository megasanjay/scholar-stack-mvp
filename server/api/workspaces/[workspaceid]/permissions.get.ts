import { serverSupabaseUser } from "#supabase/server";
import workspacePermission from "~/server/utils/workspace/workspacePermission";

export default defineEventHandler(async (event) => {
  await protectRoute(event);

  await workspaceExists(event);

  const user = await serverSupabaseUser(event);

  const { workspaceid } = event.context.params as {
    workspaceid: string;
  };

  return await workspacePermission(workspaceid, user?.id as string);
});
