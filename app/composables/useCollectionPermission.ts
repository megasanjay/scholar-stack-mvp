export default async function getCollectionPermission(
  workspaceid: string,
  collectionid: string,
) {
  const collectionPermissionGetLoading = ref(true);
  const collectionPermission = ref("");
  const collectionPermissionAbility = ref<string[]>([]);

  collectionPermissionGetLoading.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/permissions`,
    {},
  )
    .then((data) => {
      collectionPermissionGetLoading.value = false;

      if (data) {
        collectionPermission.value = data.permission;

        switch (data.permission) {
          case "viewer":
            collectionPermissionAbility.value = ["view"];
            break;
          case "editor":
            collectionPermissionAbility.value = ["view", "edit"];
            break;
          case "admin":
            collectionPermissionAbility.value = ["view", "edit", "publish"];
            break;
          default:
            break;
        }
      }
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      collectionPermissionGetLoading.value = false;
    });

  return {
    collectionPermission,
    collectionPermissionAbility,
    collectionPermissionGetLoading,
  };
}
