<script setup lang="ts">
const route = useRoute();

const { workspaceid } = route.params as { workspaceid: string };

const loadingId = ref("");

const { data: collections, error } = await useFetch(
  `/api/workspaces/${workspaceid}/hidden`,
  {
    headers: useRequestHeaders(["cookie"]),
  },
);

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your hidden collections. Please try again",
  });

  navigateTo(`/dashboard/workspaces/${workspaceid}/settings`);
}

const unhideCollection = async (collectionId: string) => {
  loadingId.value = collectionId;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionId}/unhide`,
    {
      headers: useRequestHeaders(["cookie"]),
      method: "PUT",
    },
  ).then(() => {
    push.success({
      title: "Collection Unhidden",
      message: "The collection has been unhidden from your workspace",
    });

    navigateTo(
      `/dashboard/workspaces/${workspaceid}/collections/${collectionId}`,
    )
      .catch((error) => {
        console.error(error);

        push.error({
          title: "Something went wrong",
          message: "We couldn't navigate to the collection. Please try again",
        });
      })
      .finally(() => {
        loadingId.value = "";
      });
  });
};
</script>

<template>
  <div class="flex flex-col">
    <h2 class="text-xl">Hidden Collections</h2>

    <p class="pb-6 pt-1 text-slate-700">
      These are the collections that you have hidden from your workspace. You
      can unhide them by going to the collections page and clicking on the
      `Unhide` button.
    </p>

    <n-flex vertical :size="20">
      <div
        v-for="collection in collections"
        :key="collection.id"
        class="flex flex-col space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-md transition-all"
      >
        <div
          class="flex w-full items-center justify-between gap-x-3 border-b pb-3"
        >
          <div class="flex flex-col">
            <p class="text-lg font-medium leading-tight">
              {{ collection.title }}
            </p>

            <span class="mt-1 text-sm text-slate-500">
              Updated on
              {{ $dayjs(collection.updated).format("MMMM DD, YYYY") }}
            </span>
          </div>

          <n-button
            type="info"
            secondary
            :loading="loadingId === collection.id"
            @click="unhideCollection(collection.id)"
          >
            <template #icon>
              <Icon name="mdi:eye" />
            </template>
            Unhide
          </n-button>
        </div>

        <div>
          <p class="line-clamp-4">
            {{ collection.description }}
          </p>
        </div>
      </div>
    </n-flex>
  </div>
</template>
