<script setup lang="ts">
import { UInput } from "#components";

const toast = useToast();

const workspaceName = ref("");
const workspaceDescription = ref("");
const deleteWorkspaceModalIsOpen = ref(false);

const saveLoading = ref(false);

const { workspaceid } = useRoute().params as { workspaceid: string };

const { data: workspace, error } = await useFetch(
  `/api/workspaces/${workspaceid}`,
  {},
);

if (error.value) {
  console.log(error.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    description: "We couldn't load your workspace details",
    icon: "material-symbols:error",
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

const updateWorkspaceDetails = async () => {
  saveLoading.value = true;

  await $fetch(`/api/workspaces/${workspaceid}`, {
    body: JSON.stringify({
      title: workspaceName.value.trim(),
      description: workspaceDescription.value.trim(),
    }),

    method: "PUT",
  })
    .then((_res) => {
      toast.add({
        title: "Success",
        color: "success",
        description:
          "Your workspace details have been updated. Please wait for a few seconds to see the changes.",
      });

      window.location.reload();
    })
    .catch((err) => {
      console.error(err);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't update your workspace details",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      saveLoading.value = false;
    });
};

const deleteWorkspace = () => {
  toast.add({
    title: "Not implemented",
    color: "error",
    description: "This feature is not implemented yet",
    icon: "material-symbols:error",
  });

  deleteWorkspaceModalIsOpen.value = false;
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

      <UInput
        v-model="workspaceName"
        placeholder="Workspace Name"
        class="w-full"
        size="lg"
      />

      <template #action>
        <div class="flex items-center justify-end">
          <UButton
            color="primary"
            icon="humbleicons:save"
            size="lg"
            :loading="saveLoading"
            :disabled="workspaceName.trim() === ''"
            @click="updateWorkspaceDetails"
          >
            <span class="w-max"> Save </span>
          </UButton>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Description">
      <p class="my-3 text-sm">
        This is the description of your workspace. You can change it to anything
        you want.
      </p>

      <UTextarea
        v-model="workspaceDescription"
        placeholder="Workspace Description"
        class="w-full"
        size="lg"
        :rows="4"
      />

      <template #action>
        <div class="flex items-center justify-end">
          <UButton
            color="primary"
            icon="humbleicons:save"
            size="lg"
            :loading="saveLoading"
            :disabled="workspaceName.trim() === ''"
            @click="updateWorkspaceDetails"
          >
            Save
          </UButton>
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
          <UModal v-model="deleteWorkspaceModalIsOpen">
            <UButton
              color="error"
              icon="ph:warning-duotone"
              size="lg"
              :disabled="personalWorkspace"
            >
              <span class="w-max"> Delete </span>
            </UButton>

            <template #content>
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
                    <h3 class="text-base leading-6 font-semibold text-gray-900">
                      Are you sure you want to delete this workspace?
                    </h3>

                    <div class="mt-2">
                      <p class="text-sm text-gray-500">
                        This action is not reversible, so please continue with
                        caution. This will not delete your collections and
                        resources. You will lose access to those projects.
                      </p>
                    </div>
                  </div>
                </div>

                <template #footer>
                  <div class="flex items-center justify-end space-x-2">
                    <UButton
                      icon="material-symbols:cancel-outline"
                      color="error"
                      variant="soft"
                      @click="deleteWorkspaceModalIsOpen = false"
                    >
                      Cancel
                    </UButton>

                    <UButton
                      color="error"
                      icon="ph:warning-duotone"
                      @click="deleteWorkspace"
                    >
                      <span class="w-max"> Delete workspace </span>
                    </UButton>
                  </div>
                </template>
              </UCard>
            </template>
          </UModal>
        </ContainerFlex>
      </template>
    </CardWithAction>
  </div>
</template>
