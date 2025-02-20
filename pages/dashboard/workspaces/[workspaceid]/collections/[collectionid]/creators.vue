<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent, FormError } from "#ui/types";
import { faker } from "@faker-js/faker";

definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const { collectionid, workspaceid } = useRoute().params as {
  collectionid: string;
  workspaceid: string;
};

const toast = useToast();

const loading = ref(false);
const showCreatorDrawer = ref(false);
const drawerAction = ref<"Add" | "Edit">("Add");

const createForm = useTemplateRef("createForm");

const creators = ref<CollectionCreator[]>([]);

const selectedCreator = ref<CollectionCreator>({
  affiliation: faker.company.name(),
  creatorIndex: 0,
  creatorName: faker.person.fullName(),
  familyName: faker.person.lastName(),
  givenName: faker.person.firstName(),
  identifier: "",
  identifierType: "",
  nameType: "Personal",
});

const nameTypeOptions = [
  { label: "Personal", value: "Personal" },
  { label: "Organizational", value: "Organizational" },
];

const validateForm = (_state: any): FormError[] => {
  const errors = [];

  if (!selectedCreator.value.nameType)
    errors.push({ name: "nameType", message: "Required" });

  if (!selectedCreator.value.givenName)
    errors.push({ name: "givenName", message: "Required" });

  if (selectedCreator.value.identifierType) {
    if (!selectedCreator.value.identifier)
      errors.push({ name: "identifier", message: "Required" });
  }

  if (selectedCreator.value.identifier) {
    if (!selectedCreator.value.identifierType)
      errors.push({ name: "identifierType", message: "Required" });
  }

  return errors;
};

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
      identifierType: creator.identifierType || "",
      nameType: creator.nameType,
    };
  });
};

const { data, error } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/creators`,
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

  navigateTo(
    `/dashboard/workspaces/${workspaceid}/collections/${collectionid}`,
  );
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
    identifierType: "",
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
    toast.add({
      title: "Something went wrong",
      color: "error",
      icon: "material-symbols:error",
    });
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

      method: "PUT",
    },
  )
    .then((_response) => {
      console.log("success");

      toast.add({
        title: "Creators updated successfully",
        color: "success",
        icon: "material-symbols:check-circle-outline",
      });

      creators.value = normalizeCreators(data);
      showCreatorDrawer.value = false;
    })
    .catch((error) => {
      console.error(error);

      toast.add({
        title: "Something went wrong",
        color: "error",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      loading.value = false;
    });
};

async function onSubmit(_event: FormSubmitEvent<any>) {
  if (drawerAction.value === "Edit") {
    const index = creators.value.findIndex(
      (creator) => creator.creatorIndex === selectedCreator.value.creatorIndex,
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
}

function onError(event: FormErrorEvent) {
  if (event?.errors?.[0]?.id) {
    const element = document.getElementById(event.errors[0].id);

    element?.focus();
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
</script>

<template>
  <main class="bg-white">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <div class="flex w-full items-center justify-between">
          <h1 class="text-4xl font-black">Creators</h1>

          <UButton
            color="primary"
            size="lg"
            :disabled="
              loading ||
              collectionPermissionGetLoading ||
              !collectionPermissionAbility.includes('edit')
            "
            icon="material-symbols:add"
            :loading="loading"
            @click="openAddCreatorDrawer"
          >
            Add a Creator
          </UButton>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 pt-10 lg:px-20">
      <div class="flex flex-col">
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
                  class="my-1 flex w-full flex-row items-center justify-start rounded-lg border border-zinc-300 bg-white"
                >
                  <div
                    class="flex items-center justify-center py-3 pl-3 text-slate-700 transition-all hover:text-slate-500"
                    :class="{
                      'handle cursor-move': !loading,
                      'cursor-wait': loading,
                      'animate-pulse': loading,
                    }"
                  >
                    <Icon name="icon-park-outline:drag" size="20" />
                  </div>

                  <USeparator orientation="vertical" class="mx-2 h-5" />

                  <div
                    class="flex w-full items-center justify-between py-3 pr-3"
                  >
                    <div class="flex items-center gap-2">
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

                      <ULink
                        v-if="element.identifierType === 'ORCID'"
                        :to="`https://orcid.org/${element.identifier}`"
                        target="__blank"
                        class="flex items-center text-lime-400/80 transition-all hover:text-lime-500"
                      >
                        <Icon name="simple-icons:orcid" size="20" />
                      </ULink>

                      <ULink
                        v-if="element.identifierType === 'ROR'"
                        :to="`https://ror.org/${element.identifier}`"
                        target="__blank"
                        class="flex items-center text-blue-400/80 transition-all hover:text-blue-500"
                      >
                        <Icon name="academicons:ror-square" size="25" />
                      </ULink>

                      <ULink
                        v-if="element.identifierType === 'ISNI'"
                        :to="`https://isni.org/${element.identifier}`"
                        target="__blank"
                        class="flex items-center text-blue-400/80 transition-all hover:text-blue-500"
                      >
                        <Icon name="academicons:isni" size="25" />
                      </ULink>
                    </div>

                    <div class="flex items-center gap-2">
                      <UButton
                        color="info"
                        size="sm"
                        :disabled="
                          loading ||
                          collectionPermissionGetLoading ||
                          !collectionPermissionAbility.includes('edit')
                        "
                        icon="material-symbols:edit"
                        @click="openEditCreatorDrawer(element.creatorIndex)"
                      >
                        Edit
                      </UButton>

                      <UButton
                        color="error"
                        size="sm"
                        :disabled="
                          loading ||
                          collectionPermissionGetLoading ||
                          !collectionPermissionAbility.includes('edit')
                        "
                        icon="material-symbols:delete"
                        @click="deleteCreator(element.creatorIndex)"
                      >
                        Remove
                      </UButton>
                    </div>
                  </div>
                </div>
              </template>
            </VueDraggable>
          </ClientOnly>
        </div>

        <div v-else description="No creators added" />

        <USlideover
          v-model:open="showCreatorDrawer"
          title="Add a Creator"
          description="A personal or organizational creator can be added."
          class="space-y-4"
          :ui="{ footer: 'justify-end' }"
        >
          <template #body>
            <UForm
              ref="createForm"
              :validate="validateForm"
              :state="selectedCreator"
              class="space-y-4"
              @submit="onSubmit"
              @error="onError"
            >
              <UFormField label="" name="nameType">
                <URadioGroup
                  v-model="selectedCreator.nameType"
                  orientation="horizontal"
                  :items="
                    nameTypeOptions.map((item) => ({
                      label: item.label,
                      value: item.value,
                    }))
                  "
                />
              </UFormField>

              <UFormField
                :label="
                  selectedCreator.nameType === 'Personal'
                    ? 'Given Name'
                    : 'Name'
                "
                name="givenName"
              >
                <UInput
                  v-model="selectedCreator.givenName"
                  placeholder="Ging"
                />
              </UFormField>

              <UFormField
                v-show="selectedCreator.nameType === 'Personal'"
                label="Family Name"
                name="familyName"
              >
                <UInput
                  v-model="selectedCreator.familyName"
                  placeholder="Freecss"
                />
              </UFormField>

              <UFormField label="Affiliation" name="affiliation">
                <UInput
                  v-model="selectedCreator.affiliation"
                  placeholder="Hunter Association"
                />
              </UFormField>

              <UFormField label="Identifier Type" name="identifierType">
                <div class="flex items-center gap-2">
                  <USelect
                    v-model="selectedCreator.identifierType as string"
                    :items="
                      generateIdentifierTypeOptions(selectedCreator.nameType)
                    "
                    placeholder="Select an identifier type"
                    class="w-full"
                  />

                  <UButton
                    icon="ic:baseline-clear"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    @click="selectedCreator.identifierType = null"
                  />
                </div>
              </UFormField>

              <UFormField label="Identifier" name="identifier">
                <UInput
                  v-model="selectedCreator.identifier"
                  placeholder="10.1234/abc"
                />
              </UFormField>
            </UForm>
          </template>

          <template #footer>
            <UButton
              color="primary"
              size="lg"
              :loading="loading"
              type="submit"
              @click="createForm?.submit"
            >
              Save Creator
            </UButton>
          </template>
        </USlideover>
      </div>
    </div>
  </main>
</template>
