<script setup lang="ts">
definePageMeta({
  layout: "public",
});

const toast = useToast();

const page = ref(1);

const queryParams = computed(() => {
  return {
    page: page.value - 1,
  };
});

const { data, error } = await useFetch(`/api/discover/collections`, {
  key: page.value.toString(),
  query: queryParams,
});

if (error.value) {
  console.log(error.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    description: "We couldn't load your collections",
    icon: "material-symbols:error",
  });

  navigateTo("/");
}

const requestNewPage = (newPage: number) => {
  page.value = newPage;

  navigateTo({
    path: "/view",
    query: {
      page: newPage,
    },
  });
};
</script>

<template>
  <main class="grow bg-white px-4 dark:bg-stone-900">
    <div class="mx-auto w-full max-w-screen-xl px-2.5 py-10 lg:px-20">
      <h1 class="mb-5 text-4xl font-black">Recently published collections</h1>

      <div class="flex flex-col gap-2">
        <div
          v-for="item in data?.collections"
          :key="item.id"
          class="border-b border-slate-200 py-4 dark:border-gray-700"
        >
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <NuxtLink
                :to="`/view/v${item.id}`"
                class="font-inter text-xl font-medium text-sky-500 transition-all hover:text-sky-400"
              >
                {{ item.collection.title }}
              </NuxtLink>

              <UBadge color="success" size="sm" variant="outline">
                Version {{ item.name }}
              </UBadge>
            </div>

            <p class="line-clamp-3 text-lg">
              {{ item.collection.description }}
            </p>

            <div class="mt-2 flex items-center justify-between">
              <p class="text-base">
                Published on
                {{ displayStandardDate(item.publishedOn!) }}
              </p>

              <div class="flex items-center gap-2">
                <div class="flex items-center space-x-2">
                  <Icon name="mingcute:eye-line" size="20" />

                  <span class="text-base">
                    {{ item.views }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <Icon name="mingcute:star-fill" size="20" />

                  <span class="text-base">
                    {{ item.stars }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="my-5 flex justify-center">
        <UPagination
          v-model:page="page"
          :total="data?.total"
          @update:page="requestNewPage"
        />
      </div>
    </div>
  </main>
</template>
