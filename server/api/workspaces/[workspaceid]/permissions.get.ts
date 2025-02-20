import workspacePermission from "~/server/utils/workspace/workspacePermission";
import workspaceExists from "~/server/utils/workspace/workspaceExists";

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  await workspaceExists(event);

  const { user } = session;
  const userId = user?.id as string;

  const { workspaceid } = event.context.params as {
    workspaceid: string;
  };

  return await workspacePermission(workspaceid, userId);
});
