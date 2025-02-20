<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";

import { useWorkspaceStore } from "@/stores/workspace";

const toast = useToast();

const workspaceStore = useWorkspaceStore();

const createForm = useTemplateRef("createForm");

const loading = ref(false);

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
});

type Schema = z.output<typeof schema>;

const state = reactive({
  name: "",
  description: "",
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const body = {
    title: event.data.name,
    description: event.data.description,
    personal: false,
  };

  loading.value = true;

  await $fetch("/api/workspaces", {
    body,
    method: "POST",
  })
    .then((res) => {
      loading.value = false;

      workspaceStore.hideNewWorkspaceModal();

      toast.add({
        title: "Workspace created",
        color: "success",
        description: "You can now access your workspace",
        icon: "material-symbols:check-circle-outline",
      });

      navigateTo(`/dashboard/workspaces/${res.workspace.id}`);
    })
    .catch((err) => {
      loading.value = false;

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: err.data.statusMessage,
        icon: "material-symbols:error",
      });

      console.error(err);
    })
    .finally(() => {
      loading.value = false;
    });
}
</script>

<template>
  <UModal
    v-model:open="workspaceStore.newWorkspaceModalIsOpen"
    title="Create new workspace"
  >
    <template #body>
      <UForm
        ref="createForm"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput v-model="state.name" placeholder="My awesome workspace" />
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea
            v-model="state.description"
            :maxrows="4"
            placeholder="This is my awesome workspace!"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <UButton type="submit" :loading="loading" @click="createForm?.submit()">
        <template #trailing>
          <Icon name="i-heroicons-arrow-right-20-solid" size="20" />
        </template>
        Create workspace
      </UButton>
    </template>
  </UModal>
</template>
