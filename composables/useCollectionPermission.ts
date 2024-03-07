export default async function getCollectionPermission(
  workspaceid: string,
  collectionid: string,
) {
  const collectionPermissionGetLoading = ref(true);
  const collectionPermission = ref("");

  collectionPermissionGetLoading.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/permissions`,
    {
      headers: useRequestHeaders(["cookie"]),
    },
  )
    .then((data) => {
      collectionPermissionGetLoading.value = false;

      if (data) {
        collectionPermission.value = data.permission;
      }
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      collectionPermissionGetLoading.value = false;
    });

  return { collectionPermission, collectionPermissionGetLoading };
}
