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

  const setWorkspaces = (data: Workspaces) => {
    workspaces.value = data;
  };

  const getWorkspacePermission = async (workspaceid: string) => {
    workspacePermissionGetLoading.value = true;

    await fetch(`/api/workspaces/${workspaceid}/permissions`, {
      headers: useRequestHeaders(["cookie"]),
    })
      .then((response) => response.json())
      .then((data) => {
        workspacePermissionGetLoading.value = false;

        if (data.permission === "admin") {
          workspaceAdmin.value = true;
          workspaceOwner.value = false;
          workspaceViewer.value = true;
        }

        if (data.permission === "owner") {
          workspaceAdmin.value = true;
          workspaceOwner.value = true;
          workspaceViewer.value = true;
        }

        if (data.permission === "viewer") {
          workspaceAdmin.value = false;
          workspaceOwner.value = false;
          workspaceViewer.value = true;
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        workspacePermissionGetLoading.value = false;
      });
  };

  return {
    getLoading,
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
