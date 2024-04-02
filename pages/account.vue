<script setup lang="ts">
definePageMeta({
  layout: "dashboard-root",
  middleware: ["auth"],
});
</script>

<template>
  <main class="h-screen overflow-auto bg-zinc-50">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <h1>Settings</h1>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 py-10 lg:px-20">
      <div class="flex w-full items-start justify-start space-x-12">
        <aside class="flex w-40 flex-col">
          <NuxtLink
            :to="`/account`"
            class="w-full justify-start rounded-md px-2 py-2 text-left text-slate-500 transition-all hover:bg-slate-100"
            exact-active-class="text-slate-800 font-medium"
          >
            General
          </NuxtLink>

          <NuxtLink
            :to="`/account/settings/authentication`"
            class="w-full justify-start rounded-md px-2 py-2 text-left text-slate-500 transition-all hover:bg-slate-100"
            exact-active-class="text-slate-800 font-medium"
          >
            Authentication
          </NuxtLink>
        </aside>

        <div class="flex-1">
          <NuxtPage />
        </div>
      </div>
    </div>
  </main>
</template>
