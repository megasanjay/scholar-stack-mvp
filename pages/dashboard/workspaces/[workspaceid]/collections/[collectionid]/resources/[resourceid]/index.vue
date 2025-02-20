<script setup lang="ts">
import PREFIX_JSON from "@/assets/json/prefix.json";
import { displayLongDate } from "~/utils/displayDates";

definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const toast = useToast();
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
  `/api/workspaces/${workspaceid}/collections/${collectionid}/resource/${resourceid}`,
);

if (error.value) {
  console.log(error.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    description: "We couldn't load your resource",
    icon: "material-symbols:error",
  });

  navigateTo(
    `/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources`,
  );
}

if (resource.value && "action" in resource.value) {
  // If the resource is marked for deletion, redirect the user
  // to the collection page
  if (
    resource.value.action === "delete" ||
    resource.value.action === "oldVersion"
  ) {
    toast.add({
      title: "Resource marked for deletion",
      color: "error",
      description:
        "You will need to undelete this resource before you can view it",
      icon: "material-symbols:error",
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

  const type = resource.value.identifierType;

  if (type === "url") {
    return "URL";
  }

  const prefix = PREFIX_JSON.find((prefix) => prefix.value === type);

  if (prefix) {
    return prefix.label;
  }

  return "Unknown";
});

const removeResource = async () => {
  removeResourceLoadingIndicator.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/resource/${resourceid}`,
    {
      method: "DELETE",
    },
  )
    .then((_response) => {
      removeResourceLoadingIndicator.value = false;
      removeResourceModalIsOpen.value = false;

      toast.add({
        title: "Resource deleted!",
        color: "success",
        description: "Your resource has been deleted",
        icon: "material-symbols:check-circle",
      });

      navigateTo(
        `/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources`,
      );
    })
    .catch((error) => {
      removeResourceLoadingIndicator.value = false;

      console.log(error);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't delete your resource",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      removeResourceLoadingIndicator.value = false;
    });
};

const createNewVersion = async () => {
  const body = { backLinkId: resourceid };

  newResourceVersionLoadingIndicator.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/resource/${resourceid}/new-version`,
    {
      body: JSON.stringify(body),
      method: "POST",
    },
  )
    .then((response) => {
      toast.add({
        title: "Success",
        color: "success",
        description: "A new version of your resource has been created",
        icon: "material-symbols:check-circle",
      });

      navigateTo(
        `/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources/${response.resourceId}`,
      );
    })
    .catch((error) => {
      console.log(error);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't create a new version of your resource",
        icon: "material-symbols:error",
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
        <div class="flex w-full flex-col">
          <div class="flex items-center justify-between">
            <h1 class="text-4xl font-black">Overview</h1>

            <div class="flex items-center gap-2">
              <UModal v-model:open="removeResourceModalIsOpen">
                <UButton
                  size="lg"
                  color="error"
                  :loading="removeResourceLoadingIndicator"
                  :disabled="disableEditing"
                  icon="iconoir:trash"
                >
                  Delete resource
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
                        <h3
                          class="text-base leading-6 font-semibold text-gray-900"
                        >
                          Are you sure you want to remove this resource?
                        </h3>

                        <div class="mt-2">
                          <p class="text-sm text-gray-500">
                            If this resouce is new, it will be removed
                            permanently. If it's a pre-existing resource, it
                            will be marked for deletion and you will need to
                            undelete it before you can view it.
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
                          @click="removeResourceModalIsOpen = false"
                        >
                          Cancel
                        </UButton>

                        <UButton
                          color="warning"
                          :loading="removeResourceLoadingIndicator"
                          icon="iconoir:trash"
                          @click="removeResource"
                        >
                          Remove resource
                        </UButton>
                      </div>
                    </template>
                  </UCard>
                </template>
              </UModal>

              <UModal
                v-model="newResourceVersionModalIsOpen"
                :prevent-close="newResourceVersionLoadingIndicator"
              >
                <UButton
                  v-if="
                    resource &&
                    'originalResourceId' in resource &&
                    resource?.originalResourceId &&
                    'action' in resource &&
                    resource?.action !== 'newVersion'
                  "
                  variant="outline"
                  size="lg"
                  :disabled="disableEditing"
                  :loading="newResourceVersionLoadingIndicator"
                  icon="material-symbols:conversion-path"
                >
                  Create new version
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
                        <h3
                          class="text-base leading-6 font-semibold text-gray-900"
                        >
                          Are you sure you want to create a new version of this
                          resource?
                        </h3>

                        <div class="mt-2">
                          <p class="text-sm text-gray-500">
                            This action will create a new version of this
                            resource. This action is reversible until you
                            publish this collection.
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
                          @click="newResourceVersionModalIsOpen = false"
                        >
                          Cancel
                        </UButton>

                        <UButton
                          color="primary"
                          :loading="newResourceVersionLoadingIndicator"
                          icon="material-symbols:conversion-path"
                          @click="createNewVersion"
                        >
                          Create new version
                        </UButton>
                      </div>
                    </template>
                  </UCard>
                </template>
              </UModal>

              <UButton
                color="primary"
                size="lg"
                :disabled="disableEditing"
                :to="`/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/edit`"
                icon="akar-icons:edit"
              >
                Edit resource
              </UButton>
            </div>
          </div>

          <div v-if="resource?.backLinkId" class="flex items-center">
            <span class="font-medium text-slate-500">Derived from</span>

            <UBadge type="info" size="sm">
              {{ resource?.backLinkId }}
            </UBadge>
          </div>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 pb-10 lg:px-20">
      <div class="flex items-center justify-between space-x-4 pt-10 pb-5">
        <h2 class="text-2xl font-bold">About</h2>

        <ULink
          :to="
            resource?.identifierType !== 'url'
              ? `https://identifiers.org/${resource?.identifierType}/${resource?.identifier}`
              : resource.identifier
          "
          target="_blank"
        >
          <UButton size="lg" icon="iconoir:internet"> Visit resource </UButton>
        </ULink>
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
        v-if="resource?.backLinkId"
        title="Derived from"
        :content="resource?.backLinkId"
      />

      <DataDisplay
        v-if="resource?.versionLabel"
        title="Version"
        :content="resource?.versionLabel"
      />

      <DataDisplay
        title="Created on"
        :content="displayLongDate(resource?.created as string)"
      />

      <DataDisplay
        title="Last updated on"
        :content="displayLongDate(resource?.updated as string)"
      />

      <DataDisplay title="Internal ID" :content="resource?.id" secondary />
    </div>

    <ModalNewCollection />
  </main>
</template>
