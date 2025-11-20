import { defineStore } from "pinia";

export const useCollectionStore = defineStore("Collection", () => {
  const getLoading = ref(false);

  const newCollectionModalIsOpen = ref(false);

  const collections = ref<Collections>([]);
  const collection = ref<Collection>();

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

  const setCollections = (data: Collections) => {
    collections.value = data;
  };

  return {
    collection,
    collections,
    getLoading,
    hideNewCollectionModal,
    newCollectionModalIsOpen,
    setCollections,
    showNewCollectionModal,
    sortCollections,
  };
});
