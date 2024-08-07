<script setup lang="ts">
import { Icon } from "#components";
import PREFIX_JSON from "@/assets/json/prefix.json";
import { displayLongDate } from "~/utils/displayDates";

definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const route = useRoute();

const removeResourceModalIsOpen = ref(false);
const removeResourceLoadingIndicator = ref(false);
const newResourceVersionModalIsOpen = ref(false);
const newResourceVersionLoadingIndicator = ref(false);

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
}

const { collectionPermissionAbility, collectionPermissionGetLoading } =
  await useCollectionPermission(workspaceid, collectionid);

const disableEditing = computed(() => {
  return (
    collectionPermissionGetLoading.value ||
    !collectionPermissionAbility.value.includes("edit")
  );
});

const resourceType = computed(() => {
  if (!resource.value) {
    return "Unknown";
  }

  const type = resource.value.identifier_type;

  if (type === "url") {
    return "URL";
  }

  const prefix = PREFIX_JSON.find((prefix) => prefix.value === type);

  if (prefix) {
    return prefix.label;
  }

  return "Unknown";
});

const openRemoveResourceModal = () => {
  removeResourceModalIsOpen.value = true;
};

const openNewResourceVersionModal = () => {
  newResourceVersionModalIsOpen.value = true;
};

const removeResource = async () => {
  removeResourceLoadingIndicator.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}`,
    {
      headers: useRequestHeaders(["cookie"]),
      method: "DELETE",
    },
  )
    .then((_response) => {
      removeResourceLoadingIndicator.value = false;
      removeResourceModalIsOpen.value = false;

      push.success({
        title: "Resource deleted",
        message: "Your resource has been deleted",
      });

      navigateTo(
        `/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources`,
      );
    })
    .catch((error) => {
      removeResourceLoadingIndicator.value = false;

      console.log(error);

      push.error({
        title: "Something went wrong",
        message: "We couldn't delete your resource",
      });
    })
    .finally(() => {
      removeResourceLoadingIndicator.value = false;
    });
};

const createNewVersion = async () => {
  const body = { back_link_id: resourceid };

  newResourceVersionLoadingIndicator.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/new-version`,
    {
      body: JSON.stringify(body),
      headers: useRequestHeaders(["cookie"]),
      method: "POST",
    },
  )
    .then((response) => {
      newResourceVersionLoadingIndicator.value = false;

      if (response.statusCode === 201) {
        push.success({
          title: "Success",
          message: "A new version of your resource has been created",
        });

        navigateTo(
          `/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources/${response.resourceId}`,
        );
      } else {
        push.error({
          title: "Something went wrong",
          message: "We couldn't create a new version of your resource",
        });
      }
    })
    .catch((error) => {
      newResourceVersionLoadingIndicator.value = false;

      console.log(error);

      push.error({
        title: "Something went wrong",
        message: "We couldn't create a new version of your resource",
      });
    })
    .finally(() => {
      newResourceVersionLoadingIndicator.value = false;
    });
};
</script>

<template>
  <main class="bg-white">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <n-flex vertical class="w-full">
          <n-flex justify="space-between">
            <h1>Overview</h1>

            <div class="flex items-center space-x-2">
              <n-button
                size="large"
                type="error"
                secondary
                :loading="removeResourceLoadingIndicator"
                :disabled="disableEditing"
                @click="openRemoveResourceModal"
              >
                <template #icon>
                  <Icon name="iconoir:trash" />
                </template>

                Delete resource
              </n-button>

              <n-button
                v-if="
                  resource &&
                  'original_resource_id' in resource &&
                  resource?.original_resource_id &&
                  'action' in resource &&
                  resource?.action !== 'newVersion'
                "
                ghost
                size="large"
                :disabled="disableEditing"
                :loading="newResourceVersionLoadingIndicator"
                @click="openNewResourceVersionModal"
              >
                <template #icon>
                  <Icon name="material-symbols:conversion-path" />
                </template>

                Create new version
              </n-button>

              <NuxtLink
                :to="`/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/edit`"
              >
                <n-button color="black" size="large" :disabled="disableEditing">
                  <template #icon>
                    <Icon name="tabler:edit" />
                  </template>

                  Edit resource
                </n-button>
              </NuxtLink>
            </div>
          </n-flex>

          <n-flex v-if="resource?.back_link_id" align="center">
            <span class="font-medium text-slate-500">Derived from</span>

            <n-tag type="info" size="small">
              {{ resource?.back_link_id }}
            </n-tag>
          </n-flex>
        </n-flex>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 pb-10 lg:px-20">
      <div class="flex items-center justify-between space-x-4 pb-5 pt-10">
        <h2>About</h2>

        <NuxtLink
          :to="
            resource?.identifier_type !== 'url'
              ? `https://identifiers.org/${resource?.identifier_type}/${resource?.identifier}`
              : resource.identifier
          "
          target="_blank"
        >
          <n-button size="large">
            <template #icon>
              <Icon name="iconoir:internet" />
            </template>

            Visit resource
          </n-button>
        </NuxtLink>
      </div>

      <DataDisplay
        title="Title"
        :content="resource?.title || 'No title provided'"
      />

      <DataDisplay
        title="Description"
        :content="resource?.description || 'No description available'"
      />

      <DataDisplay title="Type" :content="resourceType" />

      <DataDisplay
        title="Identifier"
        :content="resource?.identifier || 'No identifier provided'"
      />

      <DataDisplay
        v-if="resource?.back_link_id"
        title="Derived from"
        :content="resource?.back_link_id"
      />

      <DataDisplay
        v-if="resource?.version_label"
        title="Version"
        :content="resource?.version_label"
      />

      <DataDisplay
        title="Created on"
        :content="displayLongDate(resource?.created as string)"
      />

      <DataDisplay
        title="Last updated on"
        :content="displayLongDate(resource?.updated as string)"
      />

      <DataDisplay title="Internal ID" :content="resource?.id" />
    </div>

    <ModalNewCollection />

    <UModal
      v-model="removeResourceModalIsOpen"
      :prevent-close="removeResourceLoadingIndicator"
    >
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
              Are you sure you want to remove this resource?
            </h3>

            <div class="mt-2">
              <p class="text-sm text-gray-500">
                If this resouce is new, it will be removed permanently. If it's
                a pre-existing resource, it will be marked for deletion and you
                will need to undelete it before you can view it.
              </p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-end space-x-2">
            <n-button @click="removeResourceModalIsOpen = false">
              <template #icon>
                <Icon name="material-symbols:cancel-outline" />
              </template>
              Cancel
            </n-button>

            <n-button
              type="error"
              secondary
              :loading="removeResourceLoadingIndicator"
              @click="removeResource"
            >
              <template #icon>
                <Icon name="ph:warning-duotone" />
              </template>
              Remove resource
            </n-button>
          </div>
        </template>
      </UCard>
    </UModal>

    <UModal
      v-model="newResourceVersionModalIsOpen"
      :prevent-close="newResourceVersionLoadingIndicator"
    >
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
              Are you sure you want to create a new version of this resource?
            </h3>

            <div class="mt-2">
              <p class="text-sm text-gray-500">
                This action will create a new version of this resource. This
                action is reversible until you publish this collection.
              </p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-end space-x-2">
            <n-button @click="newResourceVersionModalIsOpen = false">
              <template #icon>
                <Icon name="material-symbols:cancel-outline" />
              </template>
              Cancel
            </n-button>

            <n-button
              type="error"
              secondary
              :loading="newResourceVersionLoadingIndicator"
              @click="createNewVersion"
            >
              <template #icon>
                <Icon name="material-symbols:conversion-path" />
              </template>
              Create new version
            </n-button>
          </div>
        </template>
      </UCard>
    </UModal>
  </main>
</template>
