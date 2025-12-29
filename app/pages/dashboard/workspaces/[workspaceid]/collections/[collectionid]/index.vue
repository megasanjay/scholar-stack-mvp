<script setup lang="ts">
definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

useSeoMeta({
  title: "Collections",
});

const toast = useToast();
const route = useRoute();

const { collectionid, workspaceid } = route.params as {
  collectionid: string;
  workspaceid: string;
};

const { data: collection, error } = await useFetch<CollectionGETAPIResponse>(
  `/api/workspaces/${workspaceid}/collections/${collectionid}`,
  {},
);

if (error.value) {
  console.log(error.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    description: "We couldn't load your collectionss",
    icon: "material-symbols:error",
  });

  navigateTo(`/dashboard/workspaces/${workspaceid}`);
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader
        :title="collection?.title || 'Untitled Collection'"
        :links="[
          {
            label: 'View in Catalog',
            icon: 'mdi:open-in-new',
            variant: 'solid',
            to: `/view/c${collection?.id}`,
            target: '__blank',
          },
        ]"
      >
      </UPageHeader>

      <UPageBody>
        <div>
          <div class="flex items-center justify-between pb-5">
            <h2 class="text-2xl font-bold">About</h2>
          </div>

          <DataDisplay title="Overview">
            <MarkdownRender
              v-if="collection?.description"
              :content="collection?.description || ''"
            />

            <p v-else class="text-lg">No description provided</p>
          </DataDisplay>

          <DataDisplay title="Collection Type">
            <UBadge color="info">{{ collection?.type }}</UBadge>
          </DataDisplay>

          <DataDisplay title="Visibility">
            <UBadge v-if="collection?.private" color="warning">
              Private
            </UBadge>

            <UBadge v-else color="success"> Public </UBadge>
          </DataDisplay>

          <DataDisplay
            title="Created on"
            :content="displayLongDate(collection?.created as string)"
          />

          <DataDisplay
            title="Last updated"
            :content="displayLongDate(collection?.updated as string)"
          />

          <DataDisplay title="Image">
            <NuxtImg
              :src="`${collection?.imageUrl}?t=${collection?.updated}`"
              :alt="collection?.title"
              class="h-[200px] w-auto"
            />
          </DataDisplay>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
