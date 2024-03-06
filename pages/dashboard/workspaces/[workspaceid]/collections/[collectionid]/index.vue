<script setup lang="ts">
definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const route = useRoute();

const { collectionid, workspaceid } = route.params as {
  collectionid: string;
  workspaceid: string;
};

const newVersionLoading = ref(false);
const discardVersionLoading = ref(false);

const { data: collection, error } = await useFetch<CollectionGETAPIResponse>(
  `/api/workspaces/${workspaceid}/collections/${collectionid}`,
  {
    headers: useRequestHeaders(["cookie"]),
  },
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
  newVersionLoading.value = true;

  const { data, error } = await useFetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/version`,
    {
      headers: useRequestHeaders(["cookie"]),
      method: "POST",
    },
  );

  newVersionLoading.value = false;

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

const discardDraftVersion = async () => {
  discardVersionLoading.value = true;

  const { data, error } = await useFetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/version`,
    {
      headers: useRequestHeaders(["cookie"]),
      method: "DELETE",
    },
  );

  discardVersionLoading.value = false;

  if (error.value) {
    console.log(error.value);

    push.error({
      title: "Something went wrong",
      message: "We couldn't discard the draft version",
    });
  }

  if (data.value) {
    push.success({
      title: "Success",
      message: "We discarded the draft version",
    });

    // refresh the page
    window.location.reload();
  }
};
</script>

<template>
  <main class="bg-white">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <div class="flex w-full items-center justify-between">
          <h1>
            {{ collection?.title || "Untitled Collection" }}
          </h1>

          <n-space align="center">
            <n-tag
              v-if="
                collection &&
                collection.version &&
                !collection.version.published
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
              type="success"
              size="large"
            >
              {{ collection?.version?.name || "" }}
            </n-tag>

            <div>
              <n-divider vertical />
            </div>

            <!-- <NuxtLink
              :to="`/dashboard/workspaces/${workspaceid}/collections/${collectionid}/publish`"
              class="hidden"
            >
              <n-button
                v-if="collection?.version && !collection?.version.published"
                size="large"
                color="black"
              >
                <template #icon>
                  <Icon name="solar:star-bold" />
                </template>
                Publish collection
              </n-button>
            </NuxtLink> -->

            <n-button
              v-if="collection?.version?.published || !collection?.version"
              size="large"
              :loading="newVersionLoading"
              color="black"
              @click="createNewDraftVersion"
            >
              <template #icon>
                <Icon name="carbon:intent-request-create" />
              </template>
              Prepare a draft version
            </n-button>

            <n-button
              v-if="
                collection &&
                collection.version &&
                !collection.version.published
              "
              size="large"
              type="error"
              :loading="discardVersionLoading"
              secondary
              @click="discardDraftVersion"
            >
              <template #icon>
                <Icon name="game-icons:card-discard" />
              </template>
              Discard draft version
            </n-button>
          </n-space>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <div class="flex items-center justify-between space-x-4 pb-5 pt-10">
        <h2>About</h2>
      </div>

      <h3 class="pb-2 pt-5">Description</h3>

      <p class="text-lg">
        {{ collection?.description || "No description provided" }}
      </p>

      <h3 class="pb-2 pt-5">Identifer</h3>

      <p class="text-lg">
        {{ collection?.identifier }}
      </p>

      <h3 class="pb-2 pt-5">Visibility</h3>

      <p class="text-lg">
        {{ collection?.private ? "Private" : "Public" }}
      </p>

      <h3 class="pb-2 pt-5">Created on</h3>

      <p class="text-lg">
        {{ displayLongDate(collection?.created as string) }}
      </p>

      <h3 class="pb-2 pt-5">Image</h3>

      <n-image
        v-if="collection?.image"
        :src="collection.image"
        :alt="collection.title"
        width="100"
        height="100"
      />
    </div>

    <ModalNewCollection />
  </main>
</template>
