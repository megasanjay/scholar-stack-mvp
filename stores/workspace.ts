import { defineStore } from "pinia";

export const useWorkspaceStore = defineStore("workspace", () => {
  const getLoading = ref(false);

  const newWorkspaceModalIsOpen = ref(false);

  const workspaces = ref<Workspaces>([]);
  const workspace = ref<Workspace>();

  const workspacePermissionGetLoading = ref(false);

  const workspaceAdmin = ref(false);
  const workspaceOwner = ref(false);
  const workspaceViewer = ref(false);

  const showNewWorkspaceModal = () => {
    newWorkspaceModalIsOpen.value = true;
  };

  const hideNewWorkspaceModal = () => {
    newWorkspaceModalIsOpen.value = false;
  };

  const sortWorkspaces = () => {
    // Sort the workspaces by alphabetical order
    workspaces.value.sort((a, b) => {
      if (a.title < b.title) {
        return -1;
      }

      if (a.title > b.title) {
        return 1;
      }

      return 0;
    });

    // move the personal workspace to the top
    const personalWorkspace = workspaces.value.find(
      (workspace) => workspace.personal,
    );

    if (personalWorkspace) {
      workspaces.value = [
        personalWorkspace,
        ...workspaces.value.filter((workspace) => !workspace.personal),
      ];
    }
  };

  const fetchWorkspaces = async () => {
    getLoading.value = true;

    const { data, error } = await useFetch("/api/workspaces", {
      headers: useRequestHeaders(["cookie"]),
    });

    getLoading.value = false;

    if (error.value) {
      console.error(error);
    }

    if (data.value) {
      workspaces.value = data.value;

      sortWorkspaces();
    }
  };

  const getWorkspace = async (workspaceId: string) => {
    if (workspaces.value.length === 0) {
      await fetchWorkspaces();
    }

    workspace.value = workspaces.value.find(
      (workspace) => workspace.id === workspaceId,
    );

    getWorkspacePermission(workspaceId);
  };

  const setWorkspaces = (data: Workspaces) => {
    workspaces.value = data;
  };

  const getWorkspacePermission = async (workspaceid: string) => {
    workspacePermissionGetLoading.value = true;

    const { data, error } = await useFetch(
      `/api/workspaces/${workspaceid}/permissions`,
      {
        headers: useRequestHeaders(["cookie"]),
      },
    );

    workspacePermissionGetLoading.value = false;

    if (error.value) {
      console.error(error);
    }

    if (data.value) {
      if (data.value.permission === "admin") {
        workspaceAdmin.value = true;
        workspaceOwner.value = false;
        workspaceViewer.value = true;
      }

      if (data.value.permission === "owner") {
        workspaceAdmin.value = true;
        workspaceOwner.value = true;
        workspaceViewer.value = true;
      }

      if (data.value.permission === "viewer") {
        workspaceAdmin.value = false;
        workspaceOwner.value = false;
        workspaceViewer.value = true;
      }
    }
  };

  return {
    fetchWorkspaces,
    getLoading,
    getWorkspace,
    hideNewWorkspaceModal,
    newWorkspaceModalIsOpen,
    setWorkspaces,
    showNewWorkspaceModal,
    sortWorkspaces,
    workspace,
    workspaceAdmin,
    workspaceOwner,
    workspacePermissionGetLoading,
    workspaces,
    workspaceViewer,
  };
});
