import { defineStore } from "pinia";

export const useCollectionStore = defineStore("Collection", () => {
  const getLoading = ref(false);

  const newCollectionModalIsOpen = ref(false);

  const collections = ref<Collections>([]);
  const collection = ref<Collection>();

  const collectionPermissionGetLoading = ref(false);
  const collectionPermission = ref("viewer");

  const showNewCollectionModal = () => {
    newCollectionModalIsOpen.value = true;
  };

  const hideNewCollectionModal = () => {
    newCollectionModalIsOpen.value = false;
  };

  const sortCollections = () => {
    if (collections.value.length === 0) {
      return;
    }

    // Sort the collections by last updated
    collections.value.sort((a: Collection, b: Collection) => {
      return new Date(b.updated).getTime() - new Date(a.updated).getTime();
    });
  };

  const fetchCollections = async (workspaceid: string) => {
    getLoading.value = true;

    await fetch(`/api/workspaces/${workspaceid}`, {
      headers: useRequestHeaders(["cookie"]),
    })
      .then((response) => response.json())
      .then((data) => {
        getLoading.value = false;

        if (data) {
          collections.value = data.collections;

          sortCollections();
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        getLoading.value = false;
      });
  };

  const getCollection = async (workspaceid: string, collectionid: string) => {
    if (collections.value.length === 0) {
      await fetchCollections(workspaceid);
    }

    collection.value = collections.value.find(
      (c: Collection) => c.id === collectionid,
    );

    getCollectionPermission(workspaceid, collectionid);
  };

  const getCollectionPermission = async (
    workspaceid: string,
    collectionid: string,
  ) => {
    collectionPermissionGetLoading.value = true;

    await fetch(
      `/api/workspaces/${workspaceid}/collections/${collectionid}/permissions`,
      {
        headers: useRequestHeaders(["cookie"]),
      },
    )
      .then((response) => response.json())
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
  };

  return {
    collection,
    collectionPermission,
    collectionPermissionGetLoading,
    collections,
    fetchCollections,
    getCollection,
    getLoading,
    hideNewCollectionModal,
    newCollectionModalIsOpen,
    showNewCollectionModal,
  };
});
