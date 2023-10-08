<script setup lang="ts">
import { useCollectionStore } from "@/stores/collection";

definePageMeta({
  layout: "collections-layout",
  middleware: ["auth"],
});

const push = usePush();
const route = useRoute();
const collectionStore = useCollectionStore();

const gridView = ref(true);

const { collectionid, workspaceid } = route.params as {
  collectionid: string;
  workspaceid: string;
};

const { data: collection, error } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}`,
  {
    headers: useRequestHeaders(["cookie"]),
  }
);

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your collections",
  });

  navigateTo(`/dashboard/workspaces/${workspaceid}`);
}
</script>

<template>
  <main class="h-full bg-zinc-50">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <h1>
          {{ collection?.title }}
        </h1>

        <div class="flex items-center space-x-2">
          <n-button size="large" secondary>
            <template #icon>
              <Icon name="iconoir:brain-electricity" />
            </template>
            Edit Collection
          </n-button>

          <n-button size="large" color="black">
            <template #icon>
              <Icon name="iconoir:axes" />
            </template>
            Action Button
          </n-button>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <div class="flex items-center justify-between space-x-4 py-10">
        <n-input placeholder="Search..." size="large">
          <template #prefix>
            <Icon name="iconamoon:search-duotone" size="20" class="mr-2" />
          </template>
        </n-input>

        <n-radio-group
          v-model:value="gridView"
          name="radiobuttongroup1"
          size="large"
          class="bg-white"
        >
          <n-radio-button :value="true">
            <Icon name="mingcute:grid-line" />
          </n-radio-button>

          <n-radio-button :value="false">
            <Icon name="cil:list" />
          </n-radio-button>
        </n-radio-group>

        <n-button
          size="large"
          color="black"
          @click="collectionStore.showNewCollectionModal"
        >
          <template #icon>
            <Icon name="mdi:plus" />
          </template>
          Add a new resource
        </n-button>
      </div>

      <!-- <div class="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="collection in collection?.collections"
          :key="collection.id"
          :to="`/dashboard/workspaces/${workspaceid}/collections/${collection.id}`"
          class="flex flex-col space-y-5 rounded-md border bg-white p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div class="flex items-center justify-start space-x-2">
            <n-avatar
              :size="40"
              :src="`https://api.dicebear.com/6.x/shapes/svg?seed=${collection.id}`"
              class="hover:cursor-pointer hover:opacity-80"
            />

            <div class="flex flex-col space-y-1">
              <span class="text-lg font-medium">
                {{ collection.title }}
              </span>

              <span class="text-sm text-slate-500">
                {{ collection.created }}
              </span>
            </div>
          </div>

          <div>
            <span>
              {{ collection.description }}
            </span>
          </div>
        </NuxtLink>
      </div> -->

      <pre>{{ collection }}</pre>
    </div>

    <ModalNewCollection />
  </main>
</template>