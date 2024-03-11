<script setup lang="ts">
definePageMeta({
  layout: "public",
});

const route = useRoute();

const { identifier } = route.params as { identifier: string };

const { data, error } = await useFetch(
  `/api/discover/collections/${identifier}`,
  {
    headers: useRequestHeaders(["cookie"]),
  },
);

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
  });
}
</script>

<template>
  <main class="h-screen w-full grow overflow-auto bg-white px-3 pb-10 pt-5">
    <div class="mx-auto max-w-screen-xl">
      <div class="grid grid-cols-12">
        <n-space vertical class="col-span-9 mt-5">
          <n-space align="center">
            <h1 class="mb-2">{{ data.collection.title }}</h1>

            <n-tag type="success" :bordered="false">
              Version {{ data.name }}
            </n-tag>
          </n-space>

          <p class="line-clamp-5">{{ data.collection.description }}</p>

          <p class="text-base">
            Published on
            {{ displayStandardDate(data.published_on) }}
          </p>
        </n-space>

        <NuxtImg
          :src="data.collection.image"
          :alt="data.collection.title"
          class="col-span-3 h-auto max-h-60 w-full"
        />
      </div>

      <n-divider />

      <n-tabs type="segment" animated>
        <n-tab-pane name="resources" tab="Resources">
          <template #tab>
            <n-space align="center">
              <Icon name="fluent:text-bullet-list-square-16-filled" size="18" />

              <span class="font-medium"> Resources</span>
            </n-space>
          </template>

          <pre>
          {{ data.Resources }}
        </pre
          >
        </n-tab-pane>

        <n-tab-pane name="versions" tab="Versions">
          <template #tab>
            <n-space align="center">
              <Icon name="system-uicons:versions" size="18" />

              <span class="font-medium"> Versions</span>
            </n-space>
          </template>

          <pre>
          {{ data.Versions }}
        </pre
          >
        </n-tab-pane>

        <n-tab-pane name="relations" tab="Relations">
          <template #tab>
            <n-space align="center">
              <Icon name="tabler:circles-relation" size="18" />

              <span class="font-medium"> Relations</span>
            </n-space>
          </template>

          Internal Relations
          <pre>
         {{ data.InternalRelations }}
        </pre
          >

          External Relations
          <pre>
         {{ data.ExternalRelations }}
        </pre
          >
        </n-tab-pane>
      </n-tabs>
    </div>
  </main>
</template>
