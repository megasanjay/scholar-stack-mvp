<script setup lang="ts">
definePageMeta({
  layout: "dashboard-root",
  middleware: ["auth"],
});

const { data: collections, error } = await useFetch("/api/user/stars", {
  headers: useRequestHeaders(["cookie"]),
});

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your collections",
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
        <h1>Your starred collections</h1>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <div class="flex items-center justify-between space-x-4 py-10">
        <n-input placeholder="Search..." size="large">
          <template #prefix>
            <Icon name="iconamoon:search-duotone" size="20" class="mr-2" />
          </template>
        </n-input>
      </div>

      <n-flex vertical :size="20">
        <NuxtLink
          v-for="item in collections"
          :key="item.collection_id"
          :to="`/view/${item.collection.identifier}`"
          class="flex flex-col space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-md transition-all hover:shadow-lg"
        >
          <div
            class="flex w-full items-center justify-between gap-x-3 border-b pb-3"
          >
            <div class="flex flex-col">
              <p class="text-lg font-medium leading-tight">
                {{ item.collection.title }}
              </p>

              <span class="mt-1 text-sm text-slate-500">
                Updated on
                {{ $dayjs(item.collection.updated).format("MMMM DD, YYYY") }}
              </span>
            </div>

            <NuxtImg
              :src="`https://api.dicebear.com/8.x/adventurer/svg?seed=${item.collection.id}`"
              class="mt-1 h-14 w-14 rounded-md"
            />
          </div>

          <div>
            <p class="line-clamp-4">
              {{ item.collection.description }}
            </p>
          </div>
        </NuxtLink>
      </n-flex>
    </div>

    <ModalNewCollection />
  </main>
</template>
