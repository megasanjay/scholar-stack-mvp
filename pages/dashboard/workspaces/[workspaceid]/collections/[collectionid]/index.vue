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
        :src="collection?.image_url"
        :alt="collection?.title"
        width="100"
        height="100"
      />
    </div>

    <ModalNewCollection />
  </main>
</template>
