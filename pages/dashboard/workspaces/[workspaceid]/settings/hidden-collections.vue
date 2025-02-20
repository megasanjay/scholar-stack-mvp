<script setup lang="ts">
import { UButton } from "#components";

const toast = useToast();
const route = useRoute();

const { workspaceid } = route.params as { workspaceid: string };

const loadingId = ref(0);

const { data: collections, error } = await useFetch(
  `/api/workspaces/${workspaceid}/hidden`,
  {},
);

if (error.value) {
  console.log(error.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    description: "We couldn't load your hidden collections",
    icon: "material-symbols:error",
  });

  navigateTo(`/dashboard/workspaces/${workspaceid}/settings`);
}

const unhideCollection = async (collectionId: number) => {
  loadingId.value = collectionId;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionId}/unhide`,
    {
      method: "PUT",
    },
  )
    .then(() => {
      toast.add({
        title: "Collection unhidden",
        color: "success",
        description: "The collection has been unhidden from your workspace",
        icon: "material-symbols:check-circle-outline",
      });

      navigateTo(
        `/dashboard/workspaces/${workspaceid}/collections/${collectionId}`,
      );
    })
    .catch((error) => {
      console.error(error);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't unhide the collection",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      loadingId.value = 0;
    });
};
</script>

<template>
  <div class="flex flex-col">
    <h2 class="text-xl font-medium">Hidden Collections</h2>

    <p class="pt-1 pb-6 text-slate-700">
      These are the collections that you have hidden from your workspace. You
      can unhide them by going to the collections page and clicking on the
      `Unhide` button.
    </p>

    <div class="flex flex-col gap-4 pt-6">
      <div
        v-for="collection in collections"
        :key="collection.id"
        class="flex flex-col space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-md transition-all"
      >
        <div
          class="flex w-full items-center justify-between gap-x-3 border-b pb-3"
        >
          <div class="flex items-center gap-2">
            <NuxtImg
              :src="`${collection.imageUrl}?t=${collection.updated}`"
              class="mt-1 h-14 w-14 rounded-md"
            />

            <div class="flex flex-col">
              <p class="text-lg leading-tight font-medium">
                {{ collection.title }}
              </p>

              <span class="mt-1 text-sm text-slate-500">
                Updated on
                {{ $dayjs(collection.updated).format("MMMM DD, YYYY") }}
              </span>
            </div>
          </div>

          <UButton
            color="info"
            icon="mdi:eye-off"
            :loading="loadingId === collection.id"
            @click="unhideCollection(collection.id)"
          >
            Unhide
          </UButton>
        </div>

        <div>
          <p class="line-clamp-4">
            {{ collection.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
