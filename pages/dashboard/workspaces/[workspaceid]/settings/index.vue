<script setup lang="ts">
const workspaceName = ref("");
const workspaceDescription = ref("");
const deleteWorkspaceModalIsOpen = ref(false);

const saveLoading = ref(false);

const { workspaceid } = useRoute().params as { workspaceid: string };

const { data: workspace, error } = await useFetch(
  `/api/workspaces/${workspaceid}`,
  {
    headers: useRequestHeaders(["cookie"]),
  },
);

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your workspace details",
  });

  navigateTo("/dashboard");
}

if (workspace.value) {
  workspaceName.value = workspace.value.title;
  workspaceDescription.value = workspace.value.description;
}

const personalWorkspace = computed(() => {
  return workspace.value?.personal;
});

const openModal = () => {
  deleteWorkspaceModalIsOpen.value = true;
};

const updateWorkspaceDetails = async () => {
  saveLoading.value = true;

  await $fetch(`/api/workspaces/${workspaceid}`, {
    body: JSON.stringify({
      title: workspaceName.value.trim(),
      description: workspaceDescription.value.trim(),
    }),
    headers: useRequestHeaders(["cookie"]),
    method: "PUT",
  })
    .then((_res) => {
      push.success({
        title: "Success",
        message:
          "Your workspace details have been updated. Please wait for a few seconds to see the changes.",
      });

      window.location.reload();
    })
    .catch((err) => {
      console.log(err);

      push.error({
        title: "Something went wrong",
        message: "We couldn't update your workspace details",
      });
    })
    .finally(() => {
      saveLoading.value = false;
    });
};

const deleteWorkspace = () => {
  push.error({
    title: "Not implemented",
    message: "This feature is not implemented yet",
  });

  deleteWorkspaceModalIsOpen.value = false;
  // todo: add a confirmation modal

  // const { data, error } = await useFetch(`/api/workspaces/${workspaceid}`, {
  //   headers: useRequestHeaders(["cookie"]),
  //   method: "DELETE",
  // });

  // if (error.value) {
  //   console.log(error.value);

  //   push.error({
  //     title: "Something went wrong",
  //     message: "We couldn't delete your workspace",
  //   });
  // }

  // if (data.value) {
  //   push.success({
  //     title: "Success",
  //     message: "Your workspace has been deleted",
  //   });

  //   navigateTo("/dashboard");
  // }
};
</script>

<template>
  <div class="flex flex-col space-y-4">
    <CardWithAction title="Name">
      <p class="my-3 text-sm">
        This is the name of your workspace. A workspace is a place where you can
        organize your collections as well as invite other users to collaborate
        on your projects.
      </p>

      <n-input
        v-model:value="workspaceName"
        placeholder="Workspace Name"
        class="w-full"
        size="large"
      />

      <template #action>
        <div class="flex items-center justify-end">
          <n-button
            type="primary"
            color="black"
            size="large"
            :loading="saveLoading"
            :disabled="workspaceName.trim() === ''"
            @click="updateWorkspaceDetails"
          >
            <template #icon>
              <Icon name="ic:round-save" />
            </template>
            Save
          </n-button>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Description">
      <p class="my-3 text-sm">
        This is the description of your workspace. You can change it to anything
        you want.
      </p>

      <n-input
        v-model:value="workspaceDescription"
        placeholder="Workspace Description"
        class="w-full"
        type="textarea"
        size="large"
      />

      <template #action>
        <div class="flex items-center justify-end">
          <n-button
            type="primary"
            size="large"
            color="black"
            :loading="saveLoading"
            :disabled="workspaceName.trim() === ''"
            @click="updateWorkspaceDetails"
          >
            <template #icon>
              <Icon name="ic:round-save" />
            </template>
            Save
          </n-button>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Delete workspace" class="border-red-200">
      <p class="my-3 font-medium text-red-600/70">
        Permanently remove your workspace. This action is not reversible, so
        please continue with caution. This will not delete your collections and
        resources. You will lose access to those projects.
      </p>

      <template #action>
        <ContainerFlex justify="end">
          <n-button
            type="error"
            :disabled="personalWorkspace"
            @click="openModal"
          >
            <template #icon>
              <Icon name="ph:warning-duotone" />
            </template>
            Delete
          </n-button>
        </ContainerFlex>
      </template>
    </CardWithAction>

    <UModal v-model="deleteWorkspaceModalIsOpen">
      <UCard>
        <div class="sm:flex sm:items-start">
          <div class="size-[50px]">
            <ClientOnly>
              <Vue3Lottie
                animation-link="https://cdn.lottiel.ink/assets/l7OR00APs2klZnMWu8G4t.json"
                :height="50"
                :width="50"
                :loop="1"
              />
            </ClientOnly>
          </div>

          <div class="mt-2 text-center sm:ml-4 sm:text-left">
            <h3 class="text-base font-semibold leading-6 text-gray-900">
              Are you sure you want to delete this workspace?
            </h3>

            <div class="mt-2">
              <p class="text-sm text-gray-500">
                This action is not reversible, so please continue with caution.
                This will not delete your collections and resources. You will
                lose access to those projects.
              </p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-end space-x-2">
            <n-button @click="deleteWorkspaceModalIsOpen = false">
              <template #icon>
                <Icon name="material-symbols:cancel-outline" />
              </template>
              Cancel
            </n-button>

            <n-button type="error" secondary @click="deleteWorkspace">
              <template #icon>
                <Icon name="ph:warning-duotone" />
              </template>
              I understand, delete this workspace
            </n-button>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
