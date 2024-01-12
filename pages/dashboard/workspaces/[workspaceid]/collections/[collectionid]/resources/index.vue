<script setup lang="ts">
import { useResourceStore } from "@/stores/resource";
import { displayLongDate } from "~/utils/displayDates";

definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const push = usePush();
const route = useRoute();

const resourceStore = useResourceStore();

const newResourceLoading = ref(false);
const draftVersionLoading = ref(false);

const { collectionid, workspaceid } = route.params as {
  collectionid: string;
  workspaceid: string;
};

const { data: collection, error } = await useFetch<CollectionGETAPIResponse>(
  `/api/workspaces/${workspaceid}/collections/${collectionid}`,
  {
    headers: useRequestHeaders(["cookie"]),
  }
);

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your collectionss",
  });

  navigateTo(`/dashboard/workspaces/${workspaceid}`);
}

const createNewDraftVersion = async () => {
  draftVersionLoading.value = true;

  const { data, error } = await useFetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/version`,
    {
      headers: useRequestHeaders(["cookie"]),
      method: "POST",
    }
  );

  draftVersionLoading.value = false;

  if (error.value) {
    console.log(error.value);

    push.error({
      title: "Something went wrong",
      message: "We couldn't create a new draft version",
    });
  }

  if (data.value) {
    push.success({
      title: "Success",
      message: "We created a new draft version",
    });

    // refresh the page
    window.location.reload();
  }
};

const addResource = async () => {
  newResourceLoading.value = true;

  const { data, error } = await useFetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/resources`,
    {
      headers: useRequestHeaders(["cookie"]),
      method: "POST",
    }
  );

  newResourceLoading.value = false;

  if (error.value) {
    console.log(error.value);

    push.error({
      title: "Something went wrong",
      message: "We couldn't create a new resource",
    });
  }

  if (data.value) {
    resourceStore.fetchResources(workspaceid, collectionid);

    push.success({
      title: "Success",
      message: "We created a new resource",
    });

    // get the new resource id
    const resourceId = data.value.resourceId;

    // navigate to the new resource
    navigateTo(
      `/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceId}/edit`
    );
  }
};
</script>

<template>
  <main class="h-screen overflow-auto bg-zinc-50">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2 lg:px-20"
      >
        <div class="flex items-center space-x-2">
          <h1>Resources</h1>
        </div>

        <div class="flex items-center space-x-2">
          <n-tag
            v-if="
              collection && collection.version && !collection.version.published
            "
            type="info"
            size="large"
          >
            Draft Version
          </n-tag>

          <n-tag
            v-if="
              collection && collection.version && collection.version.published
            "
            size="large"
            type="success"
          >
            {{ collection?.version?.name || "" }}
          </n-tag>

          <div v-if="collection?.version?.published || !collection?.version">
            <n-divider vertical />
          </div>

          <n-button
            v-if="collection?.version?.published || !collection?.version"
            size="large"
            :loading="draftVersionLoading"
            color="black"
            @click="createNewDraftVersion"
          >
            <template #icon>
              <Icon name="codicon:git-pull-request-draft" />
            </template>
            Create a new {{ !collection?.version ? "draft" : "" }} version
          </n-button>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 pb-10 lg:px-20">
      <div class="flex items-center justify-between space-x-4 py-10">
        <n-input placeholder="Search..." size="large">
          <template #prefix>
            <Icon name="iconamoon:search-duotone" size="20" class="mr-2" />
          </template>
        </n-input>

        <n-button
          size="large"
          color="black"
          :disabled="!collection?.version"
          :loading="newResourceLoading"
          @click="addResource"
        >
          <template #icon>
            <Icon name="mdi:plus" />
          </template>
          Add a new resource
        </n-button>
      </div>

      <div
        v-if="collection?.version === null"
        class="rounded-lg border border-dashed px-4 py-8"
      >
        <n-empty size="large" description="No resources found">
          <template #extra>
            <n-button
              color="black"
              :loading="draftVersionLoading"
              @click="createNewDraftVersion"
            >
              <template #icon>
                <Icon name="codicon:git-pull-request-draft" />
              </template>
              Create a new draft version
            </n-button>
          </template>
        </n-empty>
      </div>

      <n-space
        v-if="collection?.version && collection?.resources"
        vertical
        :size="20"
      >
        <NuxtLink
          v-for="resource in collection?.resources"
          :key="resource.id"
          :to="
            resource.action === 'delete' || resource.action === 'oldVersion'
              ? ''
              : `/dashboard/workspaces/${workspaceid}/collections/${collection?.id}/resources/${resource.id}`
          "
          class="flex w-full flex-grow flex-col space-y-5 rounded-md border p-6 shadow-sm transition-all hover:shadow-md"
          :class="{
            'cursor-not-allowed border-red-300 bg-red-50 !shadow-none':
              resource.action === 'delete' || resource.action === 'oldVersion',
            'border-slate-300 bg-white':
              !resource.action || resource.action === 'clone',
            'border-blue-300 bg-white': resource.action === 'create',
            'border-teal-400 bg-white': resource.action === 'update',
            'border-cyan-400 bg-white': resource.action === 'newVersion',
            'border-red-600 bg-white': resource.filled_in === false,
          }"
        >
          <div class="flex w-full items-center justify-start">
            <div>
              <Icon :name="resource.icon" size="35" />
            </div>

            <n-divider vertical />

            <div class="flex w-full flex-col space-y-0">
              <n-space justify="space-between" align="center">
                <span class="text-lg font-medium">
                  {{ resource.title || "No title provided" }}
                </span>

                <n-space align="center">
                  <n-tag
                    v-if="resource.filled_in === false"
                    type="error"
                    size="medium"
                  >
                    <Icon name="mdi:alert" size="16" />
                    Needs to be filled in
                  </n-tag>

                  <n-tooltip
                    v-if="
                      resource.action === 'create' ||
                      resource.action === 'update' ||
                      resource.action === 'delete' ||
                      resource.action === 'oldVersion'
                    "
                    trigger="hover"
                    placement="bottom-end"
                  >
                    <template #trigger>
                      <n-space>
                        <n-tag
                          v-if="resource.action === 'create'"
                          type="info"
                          size="medium"
                        >
                          New Resource
                        </n-tag>

                        <n-tag
                          v-if="
                            resource.action === 'delete' ||
                            resource.action === 'oldVersion'
                          "
                          type="error"
                          size="medium"
                        >
                          Marked for deletion
                        </n-tag>

                        <n-tag
                          v-if="resource.action === 'update'"
                          type="success"
                          size="medium"
                        >
                          Updated
                        </n-tag>
                      </n-space>
                    </template>
                    Last modified on {{ displayLongDate(resource.updated) }}
                  </n-tooltip>

                  <n-tag
                    v-if="resource.action === 'oldVersion'"
                    type="warning"
                    size="medium"
                  >
                    Newer Version Available
                  </n-tag>

                  <n-tag
                    v-if="resource.action === 'newVersion'"
                    type="info"
                    size="medium"
                  >
                    New Version
                  </n-tag>

                  <n-button
                    v-if="resource.action === 'delete'"
                    type="error"
                    size="small"
                  >
                    <template #icon>
                      <Icon name="mdi:undo" />
                    </template>
                    Undo delete
                  </n-button>

                  <NuxtLink
                    v-if="
                      resource.action !== 'delete' &&
                      resource.action !== 'oldVersion' &&
                      !collection?.version?.published
                    "
                    :to="`/dashboard/workspaces/${workspaceid}/collections/${collection?.id}/resources/${resource.id}/edit`"
                  >
                    <n-button type="info" size="small">
                      <template #icon>
                        <Icon name="akar-icons:edit" />
                      </template>
                      Edit
                    </n-button>
                  </NuxtLink>
                </n-space>
              </n-space>

              <div class="group flex w-max items-center space-x-1">
                <n-tag
                  :type="resource.type ? 'info' : 'error'"
                  size="small"
                  class=""
                >
                  {{ resource.type || "No identifier provided" }}
                </n-tag>

                <div>
                  <n-divider vertical />
                </div>

                <NuxtLink
                  :to="
                    resource.type !== 'url'
                      ? `https://identifiers.org/${resource.type}/${resource.target}`
                      : resource.target
                  "
                  class="font-medium text-blue-600 transition-all group-hover:text-blue-700 group-hover:underline"
                  target="_blank"
                  @click.stop=""
                >
                  {{ resource.target }}

                  <Icon
                    v-if="resource.type"
                    name="mdi:external-link"
                    size="16"
                    class="text-blue-600 transition-all group-hover:text-blue-700 group-hover:underline"
                  />
                </NuxtLink>
              </div>
            </div>
          </div>

          <p>
            {{ resource.description || "No description provided" }}
          </p>
        </NuxtLink>
      </n-space>
    </div>

    <ModalNewCollection />
  </main>
</template>
