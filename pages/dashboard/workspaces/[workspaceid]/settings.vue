<script setup lang="ts">
definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const route = useRoute();
</script>

<template>
  <main class="h-screen overflow-auto bg-zinc-50">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <h1 class="text-4xl font-black">Settings</h1>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 py-10 lg:px-20">
      <div class="flex w-full items-start justify-start space-x-12">
        <aside class="flex w-40 flex-col">
          <NuxtLink
            :to="`/dashboard/workspaces/${route.params.workspaceid}/settings`"
            class="w-full justify-start rounded-md px-2 py-2 text-left text-slate-500 transition-all hover:bg-slate-100"
            exact-active-class="text-slate-800 font-medium"
          >
            General
          </NuxtLink>

          <NuxtLink
            :to="`/dashboard/workspaces/${route.params.workspaceid}/settings/team`"
            class="w-full justify-start rounded-md px-2 py-2 text-left text-slate-500 transition-all hover:bg-slate-100"
            exact-active-class="text-slate-800 font-medium"
          >
            Team
          </NuxtLink>

          <NuxtLink
            :to="`/dashboard/workspaces/${route.params.workspaceid}/settings/hidden-collections`"
            class="w-full justify-start rounded-md px-3 py-2 pl-2 text-left text-slate-500 transition-all hover:bg-slate-100"
            exact-active-class="text-slate-800 font-medium"
          >
            Hidden Collections
          </NuxtLink>
        </aside>

        <div class="flex-1">
          <NuxtPage />
        </div>
      </div>
    </div>
  </main>
</template>
