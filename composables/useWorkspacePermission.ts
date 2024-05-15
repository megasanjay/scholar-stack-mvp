export default async function getWorkspacePermission(workspaceid: string) {
  const workspacePermissionGetLoading = ref(true);
  const workspacePermission = ref("");

  workspacePermissionGetLoading.value = true;

  await $fetch(`/api/workspaces/${workspaceid}/permissions`, {
    headers: useRequestHeaders(["cookie"]),
  })
    .then((data) => {
      workspacePermissionGetLoading.value = false;

      if (data) {
        workspacePermission.value = data.permission;

        console.log(data.permission);
      }
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      workspacePermissionGetLoading.value = false;
    });

  return { workspacePermission, workspacePermissionGetLoading };
}
