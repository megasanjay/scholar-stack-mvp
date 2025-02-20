<script setup lang="ts">
import { useCollectionStore } from "@/stores/collection";

definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

useSeoMeta({
  title: "Collections",
});

const toast = useToast();
const route = useRoute();

const collectionStore = useCollectionStore();

const { workspaceid } = route.params as { workspaceid: string };

const { data: workspace, error } = await useFetch(
  `/api/workspaces/${workspaceid}`,
  {},
);

if (error.value) {
  console.log(error.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    description: "We couldn't load your collections",
    icon: "material-symbols:error",
  });

  navigateTo("/dashboard");
}
</script>

<template>
  <main class="grow bg-zinc-50 px-4 pb-10">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <h1 class="text-4xl font-black">Collections</h1>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <div class="flex items-center justify-between gap-4 py-10">
        <UInput
          placeholder="Search..."
          icon="iconamoon:search-duotone"
          size="lg"
          type="search"
        />

        <UButton
          color="primary"
          icon="mdi:plus"
          @click="collectionStore.showNewCollectionModal"
        >
          <span class="w-max"> Create a new collection </span>
        </UButton>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <ULink
          v-for="collection in workspace?.collections"
          :key="collection.id"
          :to="`/dashboard/workspaces/${workspaceid}/collections/${collection.id}`"
          class="flex w-full flex-col space-y-4 rounded-md border border-slate-200 bg-white px-6 py-5 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-zinc-800"
        >
          <div class="flex w-full items-start justify-between space-x-2">
            <div class="flex flex-col">
              <p class="text-lg leading-tight font-medium">
                {{ collection.title }}
              </p>

              <span class="text-sm text-slate-500">
                Updated on
                {{ $dayjs(collection.updated).format("MMMM DD, YYYY") }}
              </span>
            </div>

            <UAvatar :src="collection.imageUrl" size="xl" class="rounded-sm" />
          </div>

          <div>
            <p class="line-clamp-4">
              {{ collection.description }}
            </p>
          </div>
        </ULink>
      </div>

      <USeparator
        v-if="
          workspace?.hiddenCollectionsCount &&
          workspace?.hiddenCollectionsCount > 0
        "
        dashed
      >
        <NuxtLink
          :to="`/dashboard/workspaces/${workspaceid}/settings/hidden-collections`"
          class="text-xs text-slate-300 transition-all hover:text-slate-400"
        >
          This workspace has {{ workspace?.hiddenCollectionsCount }} hidden
          collection{{ workspace?.hiddenCollectionsCount > 1 ? "s" : "" }}.
        </NuxtLink>
      </USeparator>
    </div>

    <ModalNewCollection />
  </main>
</template>
