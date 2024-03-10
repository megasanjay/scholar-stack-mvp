<script setup lang="ts">
definePageMeta({
  layout: "public",
});

const { data: collections, error } = await useFetch(
  "/api/discover/collections",
  {
    headers: useRequestHeaders(["cookie"]),
  },
);

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
  });

  navigateTo("/");
}
</script>

<template>
  <main class="grow bg-white px-4">
    <div class="mx-auto w-full max-w-screen-xl px-2.5 py-10 lg:px-20">
      <h1 class="mb-5">Recently published collections</h1>

      <n-space vertical size="large">
        <div v-for="item in collections" :key="item.id" class="border-b py-4">
          <n-space vertical>
            <n-space align="center">
              <NuxtLink
                :to="`/view/${item.identifier}`"
                class="text-xl font-medium text-sky-500 transition-all hover:text-sky-400"
              >
                {{ item.collection.title }}
              </NuxtLink>

              <n-tag type="success" :bordered="false" size="small">
                Version {{ item.name }}
              </n-tag>
            </n-space>

            <p class="line-clamp-3 text-lg">
              {{ item.collection.description }}
            </p>

            <div class="mt-2 flex items-center justify-between">
              <n-space align="center">
                <p class="text-base">
                  Published on
                  {{ displayStandardDate(item.published_on) }}
                </p>
              </n-space>

              <n-space align="center">
                <div class="flex items-center space-x-2">
                  <Icon name="mingcute:eye-line" size="20" />

                  <span class="text-base">
                    {{ item.views }}
                  </span>
                </div>

                <div class="flex items-center space-x-2">
                  <Icon name="mingcute:star-fill" size="20" />

                  <span class="text-base">
                    {{ item.stars }}
                  </span>
                </div>
              </n-space>
            </div>
          </n-space>
        </div>
      </n-space>
    </div>
  </main>
</template>
