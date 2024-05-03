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

          <NuxtLink :to="`/view/${collection?.identifier}`" target="__blank">
            <n-button size="large" color="black">
              <template #icon>
                <Icon name="mdi:open-in-new" size="20" />
              </template>

              View in Catalog
            </n-button>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <div class="flex items-center justify-between pb-5 pt-10">
        <h2>About</h2>
      </div>

      <h3 class="pb-2 pt-5">Overview</h3>

      <p class="text-lg">
        {{ collection?.description || "No description provided" }}
      </p>

      <h3 class="pb-2 pt-7">Detailed Description</h3>

      <MarkdownRender
        v-if="collection?.detailedDescription"
        :content="collection?.detailedDescription || ''"
      />

      <p v-else class="text-lg">No detailed description provided</p>

      <h3 class="pb-2 pt-7">Identifer</h3>

      <p class="text-lg">
        {{ collection?.identifier }}
      </p>

      <h3 class="pb-2 pt-7">Visibility</h3>

      <n-tag v-if="collection?.private" type="warning"> Private </n-tag>

      <n-tag v-else type="success"> Public </n-tag>

      <h3 class="pb-2 pt-7">Created on</h3>

      <p class="text-lg">
        {{ displayLongDate(collection?.created as string) }}
      </p>

      <h3 class="pb-2 pt-7">Last updated</h3>

      <p class="text-lg">
        {{ displayLongDate(collection?.updated as string) }}
      </p>

      <h3 class="pb-3 pt-7">Image</h3>

      <n-image
        :src="`${collection?.image_url}?t=${collection?.updated}`"
        :alt="collection?.title"
        class="h-[200px] w-auto"
      />
    </div>

    <ModalNewCollection />
  </main>
</template>
