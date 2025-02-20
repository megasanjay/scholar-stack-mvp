<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";
import { faker } from "@faker-js/faker";

import COLLECTION_TYPE_JSON from "@/assets/json/collection-type.json";

import { useCollectionStore } from "@/stores/collection";

const toast = useToast();
const route = useRoute();

const collectionStore = useCollectionStore();

const { workspaceid } = route.params as { workspaceid: string };

const collectionTypeOptions = COLLECTION_TYPE_JSON;

const createForm = useTemplateRef("createForm");

const loading = ref(false);

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  type: z.string().min(1, "Collection type is required"),
});

type Schema = z.output<typeof schema>;

const state = reactive({
  name: faker.commerce.productName(),
  description: faker.lorem.paragraph(),
  type: "project",
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const body = {
    title: event.data.name,
    description: event.data.description,
    type: event.data.type,
  };

  loading.value = true;

  await $fetch(`/api/workspaces/${workspaceid}/collections`, {
    body,
    method: "POST",
  })
    .then((res) => {
      loading.value = false;

      collectionStore.hideNewCollectionModal();

      toast.add({
        title: "Collection created",
        color: "success",
        description: "You can now access your collection",
        icon: "material-symbols:check-circle-outline",
      });

      navigateTo(
        `/dashboard/workspaces/${workspaceid}/collections/${res.collectionId}`,
      );
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
    v-model:open="collectionStore.newCollectionModalIsOpen"
    title="Create new collection"
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

        <UFormField label="Collection Type" name="type">
          <USelect
            v-model="state.type"
            :items="collectionTypeOptions"
            placeholder="Select a collection type"
            class="w-48"
          />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <UButton type="submit" :loading="loading" @click="createForm?.submit()">
        <template #trailing>
          <Icon name="i-heroicons-arrow-right-20-solid" size="20" />
        </template>
        Create collection
      </UButton>
    </template>
  </UModal>
</template>
