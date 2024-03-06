import { defineStore } from "pinia";

export const useResourceStore = defineStore("Resource", () => {
  const getLoading = ref(false);

  const newResourceModalIsOpen = ref(false);

  const resources = ref<ResourceType[]>([]);
  const resource = ref<ResourceType>();

  const sortResources = () => {
    if (resources.value.length === 0) {
      return;
    }

    // remove any resources that have an action of "delete" or "oldVersion"
    resources.value = resources.value.filter(
      (r) => r.action !== "delete" && r.action !== "oldVersion",
    );

    // Sort the resources by alphabetical order
    resources.value.sort((a, b) => {
      if (a.title < b.title) {
        return -1;
      }

      if (a.title > b.title) {
        return 1;
      }

      return 0;
    });
  };

  const setResources = (data: ResourceType[]) => {
    resources.value = data;

    sortResources();
  };

  const showNewResourceModal = () => {
    newResourceModalIsOpen.value = true;
  };

  const hideNewResourceModal = () => {
    newResourceModalIsOpen.value = false;
  };

  return {
    getLoading,
    hideNewResourceModal,
    newResourceModalIsOpen,
    resource,
    resources,
    setResources,
    showNewResourceModal,
    sortResources,
  };
});
