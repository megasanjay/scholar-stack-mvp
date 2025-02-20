<script setup lang="ts">
import type { FormSubmitEvent, FormError } from "#ui/types";
import { faker } from "@faker-js/faker";

import RESOURCE_TYPE_JSON from "@/assets/json/resource-type.json";
import PREFIX_JSON from "@/assets/json/prefix.json";

definePageMeta({
  name: "resource:new",
  layout: "app-layout",
  middleware: ["auth"],
});

useSeoMeta({
  title: "Add a new resource",
});

const toast = useToast();
const route = useRoute();

const resourceTypeOptions = RESOURCE_TYPE_JSON;
const identifierTypeOptions = PREFIX_JSON;

const { collectionid, workspaceid } = route.params as {
  collectionid: string;
  workspaceid: string;
};

const createForm = useTemplateRef("createForm");

const loading = ref(false);

const validateForm = (_state: any): FormError[] => {
  const errrors = [];

  if (!state.title) {
    errrors.push({
      name: "title",
      message: "Title is required",
    });
  }

  if (!state.description) {
    errrors.push({
      name: "description",
      message: "Description is required",
    });
  }

  if (!state.identifier) {
    errrors.push({
      name: "identifier",
      message: "Identifier is required",
    });
  }

  if (!state.identifierType) {
    errrors.push({
      name: "identifierType",
      message: "Identifier type is required",
    });
  }

  if (state.identifierType && state.identifier) {
    // run the identifier regex against the identifier
    const identifierRegex = new RegExp(
      identifierTypeOptions.find((i) => i.value === state.identifierType)
        ?.pattern || "",
    );

    if (!identifierRegex.test(state.identifier)) {
      errrors.push({
        name: "identifier",
        message: "Identifier is not in the correct format",
      });
    }
  }

  if (!state.resourceType) {
    errrors.push({
      name: "resourceType",
      message: "Resource type is required",
    });
  }

  return errrors;
};

const state = reactive({
  title: faker.commerce.productName(),
  description: faker.lorem.paragraph(),
  identifier: faker.internet.url(),
  identifierType: "url",
  resourceType: "other",
  versionLabel: `v${faker.number.int({ max: 10, min: 1 })}.${faker.number.int({
    max: 10,
    min: 1,
  })}.${faker.number.int({ max: 10, min: 1 })}`,
});

async function onSubmit(event: FormSubmitEvent<any>) {
  const body = {
    title: event.data.title,
    description: event.data.description,
    identifier: event.data.identifier,
    identifierType: event.data.identifierType,
    resourceType: event.data.resourceType,
    versionLabel: event.data.versionLabel,
  };

  loading.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/resources`,
    {
      body,
      method: "POST",
    },
  )
    .then(() => {
      loading.value = false;

      toast.add({
        title: "Success",
        color: "success",
        description: "We created a new resource",
        icon: "material-symbols:check-circle-outline",
      });

      // navigate to resources page
      navigateTo(
        `/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources`,
      );
    })
    .catch((error) => {
      loading.value = false;

      console.log(error);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't create a new resource",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      loading.value = false;
    });
}

// Reorganize resource type options in alphabetical order
resourceTypeOptions.sort((a, b) => a.label.localeCompare(b.label));

const { collectionPermissionAbility, collectionPermissionGetLoading } =
  await useCollectionPermission(workspaceid, collectionid);

const disableEditing = computed(() => {
  return (
    collectionPermissionGetLoading.value ||
    !collectionPermissionAbility.value.includes("edit")
  );
});
</script>

<template>
  <main class="h-auto flex-1 bg-zinc-50">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <h1 class="text-4xl font-black">Add a new resource</h1>

        <div class="flex items-center space-x-2">
          <UButton
            color="primary"
            icon="humbleicons:save"
            size="lg"
            :loading="loading"
            :disabled="disableEditing"
            @click="createForm?.submit()"
          >
            Save changes
          </UButton>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 py-10 lg:px-20">
      <UForm
        ref="createForm"
        :validate="validateForm"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Title" name="title">
          <UInput
            v-model="state.title"
            size="lg"
            placeholder="My random resource"
          />
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea
            v-model="state.description"
            :maxrows="4"
            size="lg"
            placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae nisi eget nunc ultricies aliquet. Sed vitae nisi eget nunc ultricies aliquet."
          />
        </UFormField>

        <UFormField label="Identifier Type" name="identifierType">
          <USelectMenu
            v-model="state.identifierType"
            value-key="value"
            :items="identifierTypeOptions"
            placeholder="DOI"
            class="w-full"
            size="lg"
          />
        </UFormField>

        <UFormField label="Identifier" name="identifier">
          <UInput
            v-model="state.identifier"
            :placeholder="
              identifierTypeOptions.find(
                (i) => i.value === state.identifierType,
              )?.placeholder || ''
            "
            clearable
            size="lg"
          />
        </UFormField>

        <UFormField label="Resource Type" name="resourceType">
          <USelect
            v-model="state.resourceType"
            :items="resourceTypeOptions"
            placeholder="Other"
            class="w-full"
            size="lg"
          />

          <p class="mt-2 text-sm text-slate-500">
            Select the type of resource you are linking to.
          </p>
        </UFormField>

        <UFormField label="Version" name="version">
          <UInput
            v-model="state.versionLabel"
            placeholder="v1.0.0"
            clearable
            size="lg"
          />

          <p class="mt-2 text-sm text-slate-500">
            Adding a version label will allow you to keep track of changes to
            your resource.
          </p>
        </UFormField>
      </UForm>
    </div>
  </main>
</template>
