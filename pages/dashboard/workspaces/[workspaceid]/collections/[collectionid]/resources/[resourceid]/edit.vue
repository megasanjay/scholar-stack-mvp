<script setup lang="ts">
import type { FormInst, FormItemRule, SelectOption } from "naive-ui";

import type { VNodeChild } from "vue";
import { faker } from "@faker-js/faker";
import { Icon } from "#components";

import RESOURCE_TYPE_JSON from "@/assets/json/resource-type.json";
import PREFIX_JSON from "@/assets/json/prefix.json";

definePageMeta({
  name: "resource:edit",
  layout: "app-layout",
  middleware: ["auth"],
});

const route = useRoute();

const collectionStore = useCollectionStore();

// await collectionStore.getCollection(
//   route.params.workspaceid as string,
//   route.params.collectionid as string,
// );

const currentCollection = computed(() => {
  return collectionStore.collections.find(
    (collection) => collection.id === route.params.collectionid,
  );
});

watchEffect(() => {
  if (currentCollection.value?.version?.published) {
    navigateTo(
      `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/resources/${route.params.resourceid}`,
    );
  }
});

const formRef = ref<FormInst | null>(null);

const formData = reactive<ResourceType>({
  id: route.params.resourceid as string,
  title: faker.commerce.productName(),
  back_link_id: "",
  created: "",
  description: "",
  filled_in: false,
  identifier: "",
  identifier_type: null,
  resource_type: "",
  updated: "",
  version_label: "",
});

const rules = {
  title: {
    message: "Please enter a title",
    required: true,
    trigger: ["blur", "input"],
  },
  description: {
    message: "Please enter a description",
    required: true,
    trigger: ["blur", "input"],
  },
  identifier: {
    required: true,
    trigger: ["blur", "input"],
    validator(rule: FormItemRule, value: string) {
      if (!value) {
        return new Error("Please enter your identifier");
      }

      if (selectedIdentifier.value && selectedIdentifier.value.pattern) {
        const pattern = new RegExp(selectedIdentifier.value.pattern);

        if (!pattern.test(value)) {
          return new Error(
            `Please enter a valid ${selectedIdentifier.value.label} identifier`,
          );
        }
      }

      return true;
    },
  },
  identifier_type: {
    message: "Please enter a type",
    required: true,
    trigger: ["blur", "input"],
  },
  resource_type: {
    message: "Please enter a type",
    required: true,
    trigger: ["blur", "change"],
  },
};

const resourceTypeOptions = RESOURCE_TYPE_JSON;
const identifierTypeOptions = PREFIX_JSON;

const selectedIdentifier = computed(() => {
  const identifier = identifierTypeOptions.find(
    (prefix) => prefix.value === formData.identifier_type,
  );

  return identifier;
});

const saveResourceLoadingIndicator = ref(false);

const { collectionid, resourceid, workspaceid } = route.params as {
  collectionid: string;
  resourceid: string;
  workspaceid: string;
};

const { data: resource, error } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}`,
  {
    headers: useRequestHeaders(["cookie"]),
  },
);

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your resource",
  });

  navigateTo(
    `/dashboard/workspaces/${workspaceid}/collections/${collectionid}`,
  );
}

if (resource.value && "action" in resource.value) {
  // If the resource is marked for deletion, redirect the user
  // to the collection page
  if (
    resource.value.action === "delete" ||
    resource.value.action === "oldVersion"
  ) {
    push.error({
      title: "Resource marked for deletion",
      message: "You will need to undelete this resource before you can view it",
    });

    navigateTo(
      `/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources`,
    );

    throw new Error("Resource marked for deletion");
  }

  formData.title = resource.value.title || faker.commerce.productName();
  formData.description = resource.value.description || faker.lorem.paragraph();
  formData.identifier = resource.value.identifier || faker.internet.url();
  formData.identifier_type = resource.value.identifier_type || "url";
  formData.resource_type = resource.value.resource_type || "other";
  formData.version_label = resource.value.version_label || "";
}

const selectIcon = (type: string) => {
  const resourceType = resourceTypeOptions.find(
    (resourceType) => resourceType.value === type,
  );

  if (resourceType) {
    return resourceType.icon;
  }

  return "mdi:file-question";
};

const renderLabel = (option: SelectOption): VNodeChild => {
  return [
    h(
      Icon,
      { name: selectIcon(option.value as string), class: "mr-1", size: "20" },
      {
        default: () => null,
      },
    ),
    option.label as string,
  ];
};

const selectResourceType = (value: string) => {
  if (value === "url") {
    return;
  }

  const curi = identifierTypeOptions.find((prefix) => prefix.value === value);

  if (curi) {
    formData.resource_type = curi.type;
  }
};

const saveResourceData = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      const body = {
        title: formData.title,
        description: formData.description,
        identifier: formData.identifier,
        identifierType: formData.identifier_type,
        resourceType: formData.resource_type,
        versionLabel: formData.version_label,
      };

      saveResourceLoadingIndicator.value = true;

      await $fetch(
        `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}`,
        {
          body: JSON.stringify(body),
          headers: useRequestHeaders(["cookie"]),
          method: "PUT",
        },
      )
        .then((data) => {
          saveResourceLoadingIndicator.value = false;

          if (data) {
            push.success({
              title: "Saved successfully",
              message: "Your resource has been updated",
            });

            navigateTo(
              `/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}`,
            );
          }
        })
        .catch((error) => {
          console.log(error);

          push.error({
            title: "Something went wrong",
            message: "We couldn't save your resource",
          });

          throw new Error("Something went wrong");
        })
        .finally(() => {
          saveResourceLoadingIndicator.value = false;
        });
    } else {
      console.log(errors);
      console.log("Invalid");
    }
  });
};
</script>

<template>
  <main class="h-auto flex-1 bg-zinc-50">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <h1>Edit resource</h1>

        <div class="flex items-center space-x-2">
          <n-button
            size="large"
            color="black"
            :loading="saveResourceLoadingIndicator"
            @click="saveResourceData"
          >
            <template #icon>
              <Icon name="humbleicons:save" />
            </template>

            Save changes
          </n-button>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 py-10 lg:px-20">
      <n-form
        ref="formRef"
        :label-width="80"
        :model="formData"
        :rules="rules"
        size="large"
      >
        <n-form-item path="identifier_type" label="Identifier Type">
          <div class="flex w-full flex-col">
            <n-select
              v-model:value="formData.identifier_type"
              filterable
              placeholder="DOI"
              :disabled="
                !!(
                  resource &&
                  'action' in resource &&
                  (resource?.action === 'clone' ||
                    resource?.action === 'oldVersion')
                )
              "
              :options="identifierTypeOptions"
              @update:value="selectResourceType"
            />

            <p class="mt-2 text-sm text-slate-500">
              Select the type of identifier you are linking to.
            </p>
          </div>
        </n-form-item>

        <n-form-item path="identifier" label="Resource Identifier">
          <div class="flex w-full flex-col">
            <n-input
              v-model:value="formData.identifier"
              :placeholder="selectedIdentifier?.placeholder"
              type="text"
              :disabled="
                !formData.identifier ||
                !!(
                  resource &&
                  'action' in resource &&
                  (resource?.action === 'clone' ||
                    resource?.action === 'oldVersion')
                )
              "
              clearable
              @keydown.enter.prevent
            />

            <n-collapse-transition :show="!!formData.identifier">
              <p class="mt-2 text-sm text-slate-500">
                Click here to see if your linked resource is available and
                resolves correctly.
              </p>
            </n-collapse-transition>
          </div>
        </n-form-item>

        <n-form-item label="Title" path="title">
          <n-input
            v-model:value="formData.title"
            placeholder="My random resource"
            clearable
          />
        </n-form-item>

        <n-form-item label="Description" path="description">
          <n-input
            v-model:value="formData.description"
            placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae nisi eget nunc ultricies aliquet. Sed vitae nisi eget nunc ultricies aliquet."
            type="textarea"
            clearable
          />
        </n-form-item>

        <n-form-item label="Version" path="version">
          <div class="flex w-full flex-col">
            <n-input
              v-model:value="formData.version_label"
              placeholder="v1.0.0"
              clearable
            />

            <p class="mt-2 text-sm text-slate-500">
              Adding a version label will allow you to keep track of changes to
              your resource.
            </p>
          </div>
        </n-form-item>

        <n-form-item path="resource_type" label="Resource Type">
          <n-select
            v-model:value="formData.resource_type"
            filterable
            clearable
            :options="resourceTypeOptions"
            :render-label="renderLabel"
          />
        </n-form-item>
      </n-form>
    </div>

    <ModalNewCollection />
  </main>
</template>
