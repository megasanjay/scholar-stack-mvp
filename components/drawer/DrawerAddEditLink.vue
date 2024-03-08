<script setup lang="ts">
import { useMessage } from "naive-ui";
import type { FormInst, SelectOption } from "naive-ui";
import type { VNodeChild } from "vue";
import { faker } from "@faker-js/faker";
import { nanoid } from "nanoid";
import { Icon } from "#components";

import RESOURCE_TYPE_JSON from "@/assets/json/resource-type.json";
import PREFIX_JSON from "@/assets/json/prefix.json";

import { useLinkStore } from "@/stores/link";

const props = defineProps({
  hideAddEditLinkDrawerFunction: {
    required: true,
    type: Function,
  },
  linkIdentifier: {
    required: true,
    type: String,
  },
  projectIdentifier: {
    required: true,
    type: String,
  },
});

const message = useMessage();

const linkStore = useLinkStore();

const loading = ref(false);

const formRef = ref<FormInst | null>(null);

const formValue: LocalLinkType = reactive({
  id: nanoid(),
  name: faker.git.commitMessage(),
  description: faker.word.words({ count: { max: 100, min: 50 } }),
  icon: "material-symbols:dataset",
  target: "",
  // target: faker.internet.url(),
  type: "",
});

const resourceTypeOptions = RESOURCE_TYPE_JSON;
const typeOptions = PREFIX_JSON;

const placeholder = computed(() => {
  if (formValue.type) {
    // find the prefix
    const prefix = typeOptions.find(
      (prefix) => prefix.value === formValue.type,
    );

    if (prefix) {
      return prefix.placeholder;
    }

    return "https://doi.org/10.1101/2021.05.07.443555";
  }

  return "https://doi.org/10.1101/2021.05.07.443555";
});

if (props.linkIdentifier !== "new") {
  const link = linkStore.getLink(props.linkIdentifier);

  if (link) {
    formValue.id = link.id;
    formValue.name = link.name;
    formValue.description = link.description;
    formValue.target = link.target;
    formValue.type = link.type;
    formValue.icon = link.icon;
  }
}

const rules = {
  name: {
    message: "Please enter a title",
    required: true,
    trigger: ["input"],
  },
  description: {
    message: "Please enter a description",
    required: true,
    trigger: ["input"],
  },
  target: {
    message: "Please enter a valid identifier",
    required: true,
    trigger: ["input"],
  },
  type: {
    message: "Please select a type",
    required: true,
    trigger: ["change"],
  },
};

const renderLabel = (option: SelectOption): VNodeChild => {
  return [
    h(
      Icon,
      { name: option.value as string, class: "mr-1", size: "20" },
      {
        default: () => null,
      },
    ),
    option.label as string,
  ];
};

const drawerTitle = computed(() => {
  if (props.linkIdentifier === "new") {
    return "Add Resource";
  }

  return "Edit Resource";
});

const buttonDetails = computed(() => {
  if (props.linkIdentifier === "new") {
    return {
      icon: "ph:plus-circle-bold",
      text: "Add Resource",
    };
  }

  return {
    icon: "material-symbols:save",
    text: "Save Changes",
  };
});

const selectIcon = (value: string) => {
  const curi = typeOptions.find((prefix) => prefix.value === value);

  if (curi) {
    formValue.icon = curi.icon;
  }
};

const addResource = (e: MouseEvent) => {
  e.preventDefault();

  formRef.value?.validate((errors) => {
    if (!errors) {
      loading.value = true;

      if (props.linkIdentifier === "new") {
        // For new resources
        const link = {
          id: nanoid(),
          name: formValue.name.trim(),

          action: "create" as LinkAction,

          description: formValue.description.trim(),
          icon: formValue.icon,
          origin: "local" as LinkOrigin,

          target: formValue.target.trim(),
          type: formValue.type,
        };

        linkStore.addLink(link);

        message.success("Resource added successfully");
      } else {
        const link = linkStore.getLink(props.linkIdentifier);

        if (link) {
          if (link.origin === "remote") {
            link.action = "update";

            /**
             * If the edited resource from the form is the same as
             * the original remote resource,
             * then we don't need to show the resource as updated
             */
            if (
              link.original?.name === formValue.name.trim() &&
              link.original?.description === formValue.description.trim() &&
              link.original?.target === formValue.target.trim() &&
              link.original?.type === formValue.type &&
              link.original?.icon === formValue.icon
            ) {
              delete link.action;
            }
          }

          link.name = formValue.name.trim();
          link.description = formValue.description.trim();
          link.target = formValue.target.trim();
          link.type = formValue.type;
          link.icon = formValue.icon;

          linkStore.updateLink(link);

          message.success("Resource updated successfully");
        }
      }

      props.hideAddEditLinkDrawerFunction();

      loading.value = false;
    } else {
      console.log(errors);
    }
  });
};
</script>

<template>
  <n-drawer-content :title="drawerTitle" :closable="false">
    <n-form
      ref="formRef"
      :model="formValue"
      :rules="rules"
      size="large"
      label-placement="top"
      :show-feedback="true"
    >
      <div class="flex w-full flex-col space-y-2 p-3">
        <n-form-item path="name" label="Name of Resource">
          <n-input
            v-model:value="formValue.name"
            placeholder="Primary data for the paper: MicroCT imaging of the human cervical vagus nerve"
            @keydown.enter.prevent
          />
        </n-form-item>

        <n-form-item path="description" label="Description">
          <n-input
            v-model:value="formValue.description"
            placeholder="MicroCT imaging of the human cervical vagus nerve: slices at 0.5 cm spacing are provided across a 5 cm window representing the surgical window typical of vagus nerve stimulation. Derived data include fascicle morphometry, splitting and merging events."
            rows="5"
            type="textarea"
            @keydown.enter.prevent
          />
        </n-form-item>

        <n-form-item path="type" label="Identifier Type">
          <div class="flex w-full flex-col">
            <n-select
              v-model:value="formValue.type"
              filterable
              placeholder="DOI"
              :options="typeOptions"
              @update:value="selectIcon"
            />

            <p class="mt-2 text-sm text-slate-500">
              Select the type of identifier you are linking to.
            </p>
          </div>
        </n-form-item>

        <n-form-item path="target" label="Resource Identifier">
          <div class="flex w-full flex-col">
            <n-input
              v-model:value="formValue.target"
              :placeholder="placeholder"
              type="text"
              :disabled="!formValue.type"
              @keydown.enter.prevent
            />

            <p class="mt-2 text-sm text-slate-500">
              Click here to see if your linked resource is available and
              resolves correctly.
            </p>
          </div>
        </n-form-item>

        <n-form-item path="icon" label="Icon">
          <n-select
            v-model:value="formValue.icon"
            filterable
            :options="resourceTypeOptions"
            :render-label="renderLabel"
          />
        </n-form-item>
      </div>
    </n-form>

    <div class="flex items-center justify-center space-x-4">
      <n-button
        type="error"
        size="large"
        secondary
        @click="props.hideAddEditLinkDrawerFunction"
      >
        <template #icon>
          <Icon name="material-symbols:cancel-outline" />
        </template>
        Cancel
      </n-button>

      <n-button
        type="primary"
        size="large"
        :loading="loading"
        @click="addResource"
      >
        <template #icon>
          <Icon :name="buttonDetails.icon" />
        </template>

        {{ buttonDetails.text }}
      </n-button>
    </div>
  </n-drawer-content>
</template>
