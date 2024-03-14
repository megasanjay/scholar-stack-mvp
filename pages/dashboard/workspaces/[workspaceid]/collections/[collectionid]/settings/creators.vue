<script setup lang="ts">
// import { nanoid } from "nanoid";
import type { FormInst } from "naive-ui";

const { collectionid, workspaceid } = useRoute().params as {
  collectionid: string;
  workspaceid: string;
};

const loading = ref(false);

const formRef = ref<FormInst | null>(null);
const moduleData = reactive<{
  creators: CollectionCreators;
}>({
  creators: [],
});

const nameTypeOptions = [
  { label: "Personal", value: "Personal" },
  { label: "Organizational", value: "Organizational" },
];

const generateIdentifierTypeOptions = (nameType: string = "Personal") => {
  if (nameType === "Personal") {
    return [{ label: "ORCID", value: "ORCID" }];
  }

  return [
    { label: "ROR", value: "ROR" },
    { label: "ISNI", value: "ISNI" },
  ];
};

const normalizeCreators = (data: CollectionCreators = []) => {
  return data.map((creator: CollectionCreator, index: number) => {
    return {
      affiliation: creator.affiliation || "",
      creatorIndex: index,
      creatorName: creator.creatorName || "",
      familyName: creator.familyName || "",
      givenName: creator.givenName,
      identifier: creator.identifier || "",
      identifierType: creator.identifierType || null,
      nameType: creator.nameType,
    };
  });
};

const { data, error } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/creators`,
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

if (data.value) {
  moduleData.creators = normalizeCreators(data.value);
}

const addCreator = () => {
  moduleData.creators.push({
    affiliation: "",
    creatorIndex: moduleData.creators.length + 1,
    creatorName: "",
    familyName: "",
    givenName: "",
    identifier: "",
    identifierType: null,
    nameType: "Personal",
  });
};

const saveCreators = (e: MouseEvent) => {
  e.preventDefault();
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      const creators = moduleData.creators.map((creator, index) => {
        return {
          affiliation: creator.affiliation || "",
          creatorIndex: index,
          creatorName: creator.creatorName || "",
          familyName: creator.familyName || "",
          givenName: creator.givenName,
          identifier: creator.identifier || "",
          identifierType: creator.identifierType || "",
          nameType: creator.nameType,
        };
      });

      loading.value = true;

      await $fetch(
        `/api/workspaces/${workspaceid}/collections/${collectionid}/creators`,
        {
          body: JSON.stringify(creators),
          headers: useRequestHeaders(["cookie"]),
          method: "PUT",
        },
      )
        .then((response) => {
          console.log("success");

          push.success("Creators updated successfully.");

          moduleData.creators = normalizeCreators(response.creators);
        })
        .catch((error) => {
          console.error(error);
          push.error("Something went wrong.");
        })
        .finally(() => {
          loading.value = false;
        });

      console.log("success");
    } else {
      console.error(errors);
    }
  });
};
</script>

<template>
  <div class="flex flex-col">
    <h2 class="text-xl">Creators</h2>

    <p class="mb-6 pt-1 text-slate-700">
      You can add or remove creators from this collection. The people and/or
      organizations listed here are also shown on the public catalog page.
    </p>

    <n-form
      ref="formRef"
      :model="moduleData"
      size="large"
      label-placement="top"
      class="pr-4"
    >
      <n-empty
        v-if="moduleData.creators.length === 0"
        description="No creators found"
      />

      <n-space v-else vertical size="large">
        <div v-for="(item, index) in moduleData.creators" :key="index" bordered>
          <!-- <template #header-extra>
            <n-popconfirm @positive-click="removeCollaborator(item.id)">
              <template #trigger>
                <n-button type="error" secondary>
                  <template #icon>
                    <f-icon icon="ep:delete" />
                  </template>

                  Remove Collaborator
                </n-button>
              </template>

              Are you sure you want to remove this Collaborator?
            </n-popconfirm>
          </template> -->

          <n-form-item
            label="Name Type"
            :show-label="false"
            :path="`creators[${index}].name_type`"
          >
            <n-radio-group
              v-model:value="item.nameType"
              name="radiobuttongroup1"
            >
              <n-radio-button
                v-for="nameTypeOption in nameTypeOptions"
                :key="nameTypeOption.value"
                :value="nameTypeOption.value"
                :label="nameTypeOption.label"
              />
            </n-radio-group>
          </n-form-item>

          <div class="flex items-start space-x-4">
            <n-form-item
              :label="item.nameType === 'Personal' ? 'Given Name' : 'Name'"
              :path="`creators[${index}].givenName`"
              :rule="{
                message: 'Please enter a name',
                required: true,
                trigger: ['blur', 'change'],
              }"
              class="w-full"
            >
              <n-input
                v-model:value="item.givenName"
                :placeholder="item.nameType === 'Personal' ? 'Ging' : 'Zodiacs'"
                clearable
              />
            </n-form-item>

            <n-form-item
              v-if="item.nameType === 'Personal'"
              label="Family Name"
              :path="`creators[${index}].familyName`"
              class="w-full"
            >
              <n-input
                v-model:value="item.familyName"
                placeholder="Freecss"
                clearable
              />
            </n-form-item>
          </div>

          <n-form-item
            label="Affiliation"
            :path="`creators[${index}].affiliation`"
          >
            <n-input
              v-model:value="item.affiliation"
              placeholder="Hunter Association"
              clearable
            />
          </n-form-item>

          <div class="flex items-start space-x-4">
            <n-form-item
              label="Identifier Type"
              :path="`creators[${index}].identifierType`"
              :rule="{
                message: 'Please select an identifier type',
                required: item.identifier,
                trigger: ['blur', 'change'],
              }"
              class="w-full"
            >
              <n-select
                v-model:value="item.identifierType"
                clearable
                placeholder="Select an identifier type"
                :options="generateIdentifierTypeOptions(item.nameType)"
              >
              </n-select>
            </n-form-item>

            <n-form-item
              label="Identifier"
              :path="`creators[${index}].identifier`"
              :rule="{
                message: 'Please enter an identifier',
                required: item.identifierType,
                trigger: ['blur', 'change'],
              }"
              class="w-full"
            >
              <n-input
                v-model:value="item.identifier"
                :placeholder="
                  item.identifierType
                    ? item.identifierType === 'ROR'
                      ? '0156zyn36'
                      : '0000-0003-2829-8032'
                    : ''
                "
                clearable
              />
            </n-form-item>
          </div>

          <div v-if="index + 1 !== moduleData.creators.length">
            <n-divider />
          </div>
        </div>
      </n-space>

      <div class="mt-5 flex items-center justify-between">
        <n-button text type="info" @click="addCreator">
          <template #icon>
            <Icon name="material-symbols:add" />
          </template>

          Add a Creator
        </n-button>

        <n-button
          color="black"
          :loading="loading"
          :disabled="moduleData.creators.length === 0"
          @click="saveCreators"
        >
          <template #icon>
            <Icon name="lets-icons:save-duotone" />
          </template>

          Save
        </n-button>
      </div>
    </n-form>

    <pre
      >{{ moduleData.creators }} 
    </pre>
  </div>
</template>
