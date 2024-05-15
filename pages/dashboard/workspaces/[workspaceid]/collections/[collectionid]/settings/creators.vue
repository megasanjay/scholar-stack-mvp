<script setup lang="ts">
import type { FormInst } from "naive-ui";

const { collectionid, workspaceid } = useRoute().params as {
  collectionid: string;
  workspaceid: string;
};

const loading = ref(false);

const showCreatorDrawer = ref(false);

const drawerAction = ref<"Add" | "Edit">("Add");

const formRef = ref<FormInst | null>(null);
const creators = ref<CollectionCreator[]>([]);

const selectedCreator = ref<CollectionCreator>({
  affiliation: "",
  creatorIndex: 0,
  creatorName: "",
  familyName: "",
  givenName: "",
  identifier: "",
  identifierType: null,
  nameType: "Personal",
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
  creators.value = normalizeCreators(data.value);
}

const { collectionPermissionAbility, collectionPermissionGetLoading } =
  await useCollectionPermission(workspaceid, collectionid);

const openAddCreatorDrawer = () => {
  selectedCreator.value = {
    affiliation: "",
    creatorIndex: creators.value.length + 1,
    creatorName: "",
    familyName: "",
    givenName: "",
    identifier: "",
    identifierType: null,
    nameType: "Personal",
  };

  drawerAction.value = "Add";
  showCreatorDrawer.value = true;
};

const openEditCreatorDrawer = (index: number) => {
  const creator = creators.value[index];

  if (creator) {
    selectedCreator.value = {
      affiliation: creator.affiliation,
      creatorIndex: creator.creatorIndex,
      creatorName: creator.creatorName,
      familyName: creator.familyName,
      givenName: creator.givenName,
      identifier: creator.identifier,
      identifierType: creator.identifierType,
      nameType: creator.nameType,
    };

    drawerAction.value = "Edit";
    showCreatorDrawer.value = true;
  } else {
    push.error("Something went wrong");
  }
};

const deleteCreator = (index: number) => {
  const newCreators = creators.value.filter(
    (creator) => creator.creatorIndex !== index,
  );

  creators.value = normalizeCreators(newCreators);

  saveCreators();
};

const saveCreators = async () => {
  const data = creators.value.map((creator, index) => {
    return {
      ...creator,
      creatorIndex: index,
      identifierType: creator.identifierType || "",
    };
  });

  loading.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/creators`,
    {
      body: JSON.stringify(data),
      headers: useRequestHeaders(["cookie"]),
      method: "PUT",
    },
  )
    .then((_response) => {
      console.log("success");

      push.success("Creators updated successfully.");

      creators.value = normalizeCreators(data);
      showCreatorDrawer.value = false;
    })
    .catch((error) => {
      console.error(error);
      push.error("Something went wrong.");
    })
    .finally(() => {
      loading.value = false;
    });
};

const confirmEdits = (e: MouseEvent) => {
  e.preventDefault();
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      // update the creator in the list
      if (drawerAction.value === "Edit") {
        const index = creators.value.findIndex(
          (creator) =>
            creator.creatorIndex === selectedCreator.value.creatorIndex,
        );

        if (index !== -1) {
          creators.value[index] = {
            affiliation: selectedCreator.value.affiliation,
            creatorIndex: selectedCreator.value.creatorIndex,
            creatorName: selectedCreator.value.creatorName,
            familyName: selectedCreator.value.familyName,
            givenName: selectedCreator.value.givenName,
            identifier: selectedCreator.value.identifier,
            identifierType: selectedCreator.value.identifierType,
            nameType: selectedCreator.value.nameType,
          };
        }
      } else {
        // add the creator to the list
        creators.value.push({
          affiliation: selectedCreator.value.affiliation,
          creatorIndex: selectedCreator.value.creatorIndex,
          creatorName: selectedCreator.value.creatorName,
          familyName: selectedCreator.value.familyName,
          givenName: selectedCreator.value.givenName,
          identifier: selectedCreator.value.identifier,
          identifierType: selectedCreator.value.identifierType,
          nameType: selectedCreator.value.nameType,
        });
      }

      await saveCreators();
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

    <div v-if="creators.length > 0">
      <ClientOnly>
        <VueDraggable
          v-model="creators"
          tag="div"
          item-key="creatorIndex"
          :animation="200"
          handle=".handle"
          class="list-group"
          @end="saveCreators"
        >
          <template #item="{ element }">
            <div
              class="my-1 flex w-full flex-row justify-start rounded-lg border bg-white"
            >
              <div
                class="flex items-center justify-center py-3 pl-3 text-slate-700 transition-all hover:text-slate-500"
                :class="{
                  'handle cursor-move': !loading,
                  'cursor-wait': loading,
                }"
              >
                <n-spin :show="loading" size="small">
                  <Icon name="icon-park-outline:drag" size="20" />
                </n-spin>
              </div>

              <div class="py-3">
                <n-divider vertical />
              </div>

              <div class="flex w-full items-center justify-between py-3 pr-3">
                <n-space align="center">
                  <Icon
                    v-if="element.nameType === 'Personal'"
                    name="material-symbols:person"
                    size="20"
                  />

                  <Icon
                    v-if="element.nameType === 'Organizational'"
                    name="octicon:organization-24"
                    size="20"
                  />

                  <span>
                    {{
                      element.familyName
                        ? `${element.familyName}, ${element.givenName}`
                        : element.givenName
                    }}
                  </span>

                  <NuxtLink
                    v-if="element.identifierType === 'ORCID'"
                    :to="`https://orcid.org/${element.identifier}`"
                    target="__blank"
                    class="text-lime-400/80 transition-all hover:text-lime-500"
                  >
                    <Icon name="simple-icons:orcid" size="20" />
                  </NuxtLink>

                  <NuxtLink
                    v-if="element.identifierType === 'ROR'"
                    :to="`https://ror.org/${element.identifier}`"
                    target="__blank"
                    class="text-blue-400/80 transition-all hover:text-blue-500"
                  >
                    <Icon name="academicons:ror-square" size="25" />
                  </NuxtLink>

                  <NuxtLink
                    v-if="element.identifierType === 'ISNI'"
                    :to="`https://isni.org/${element.identifier}`"
                    target="__blank"
                    class="text-blue-400/80 transition-all hover:text-blue-500"
                  >
                    <Icon name="academicons:isni" size="25" />
                  </NuxtLink>
                </n-space>

                <n-space>
                  <n-button
                    type="info"
                    size="small"
                    :disabled="
                      loading ||
                      collectionPermissionGetLoading ||
                      !collectionPermissionAbility.includes('edit')
                    "
                    @click="openEditCreatorDrawer(element.creatorIndex)"
                  >
                    <template #icon>
                      <Icon name="material-symbols:edit" />
                    </template>
                    Edit
                  </n-button>

                  <n-button
                    type="error"
                    size="small"
                    :disabled="
                      loading ||
                      collectionPermissionGetLoading ||
                      !collectionPermissionAbility.includes('edit')
                    "
                    @click="deleteCreator(element.creatorIndex)"
                  >
                    <template #icon>
                      <Icon name="material-symbols:delete" />
                    </template>

                    Remove
                  </n-button>
                </n-space>
              </div>
            </div>
          </template>
        </VueDraggable>
      </ClientOnly>
    </div>

    <n-empty v-else description="No creators added" />

    <div class="mt-3 flex justify-start">
      <n-button
        color="black"
        size="large"
        class="mt-4 w-max"
        :disabled="
          loading ||
          collectionPermissionGetLoading ||
          !collectionPermissionAbility.includes('edit')
        "
        @click="openAddCreatorDrawer"
      >
        <template #icon>
          <Icon name="material-symbols:add" />
        </template>

        Add a Creator
      </n-button>
    </div>

    <n-drawer v-model:show="showCreatorDrawer" :width="502" placement="right">
      <n-drawer-content
        :title="`${drawerAction} creator`"
        :mask-closable="!loading"
        :close-on-esc="!loading"
        :closable="!loading"
      >
        <n-form
          ref="formRef"
          :model="selectedCreator"
          size="large"
          label-placement="top"
          class="pr-4"
        >
          <n-space vertical size="large">
            <n-form-item
              label="Name Type"
              :show-label="false"
              :path="`name_type`"
            >
              <n-radio-group
                v-model:value="selectedCreator.nameType"
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

            <n-form-item
              :label="
                selectedCreator.nameType === 'Personal' ? 'Given Name' : 'Name'
              "
              path="givenName"
              :rule="{
                message: 'Please enter a name',
                required: true,
                trigger: ['blur', 'change'],
              }"
              class="w-full"
            >
              <n-input
                v-model:value="selectedCreator.givenName"
                :placeholder="
                  selectedCreator.nameType === 'Personal' ? 'Ging' : 'Zodiacs'
                "
                clearable
              />
            </n-form-item>

            <n-form-item
              v-if="selectedCreator.nameType === 'Personal'"
              label="Family Name"
              path="familyName"
              class="w-full"
            >
              <n-input
                v-model:value="selectedCreator.familyName"
                placeholder="Freecss"
                clearable
              />
            </n-form-item>

            <n-form-item label="Affiliation" path="affiliation">
              <n-input
                v-model:value="selectedCreator.affiliation"
                placeholder="Hunter Association"
                clearable
              />
            </n-form-item>

            <n-form-item
              label="Identifier Type"
              path="identifierType"
              :rule="{
                message: 'Please select an identifier type',
                required: !!selectedCreator.identifier,
                trigger: ['blur', 'change'],
              }"
              class="w-full"
            >
              <n-select
                v-model:value="selectedCreator.identifierType"
                clearable
                placeholder="Select an identifier type"
                :options="
                  generateIdentifierTypeOptions(selectedCreator.nameType)
                "
              >
              </n-select>
            </n-form-item>

            <n-form-item
              label="Identifier"
              path="identifier"
              :rule="{
                message: 'Please enter an identifier',
                required: !!selectedCreator.identifierType,
                trigger: ['blur', 'change'],
              }"
              class="w-full"
            >
              <n-input
                v-model:value="selectedCreator.identifier"
                :placeholder="
                  selectedCreator.identifierType
                    ? selectedCreator.identifierType === 'ROR'
                      ? '0156zyn36'
                      : '0000-0003-2829-8032'
                    : ''
                "
                clearable
              />
            </n-form-item>
          </n-space>
        </n-form>

        <template #footer>
          <n-button
            type="info"
            :loading="loading"
            size="large"
            @click="confirmEdits"
          >
            <template #icon>
              <Icon name="material-symbols:save-sharp" />
            </template>
            {{ drawerAction === "Add" ? "Add" : "Save" }} Creator
          </n-button>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
