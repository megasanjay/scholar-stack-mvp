<script setup lang="ts">
definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const route = useRoute();
</script>

<template>
  <AppPageLayout title="Settings">
    <div class="flex w-full items-start justify-start gap-12">
      <aside class="flex w-40 flex-col">
        <NuxtLink
          :to="`/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/settings`"
          class="w-full justify-start rounded-md px-2 py-2 text-left text-slate-500 transition-all hover:bg-slate-100"
          exact-active-class="text-slate-800 font-medium"
        >
          General
        </NuxtLink>

        <NuxtLink
          :to="`/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/settings/creators`"
          class="hidden w-full justify-start rounded-md px-2 py-2 text-left text-slate-500 transition-all hover:bg-slate-100"
          exact-active-class="text-slate-800 font-medium"
        >
          Creators
        </NuxtLink>

        <NuxtLink
          :to="`/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/settings/team`"
          class="w-full justify-start rounded-md px-2 py-2 text-left text-slate-500 transition-all hover:bg-slate-100"
          exact-active-class="text-slate-800 font-medium"
        >
          Team
        </NuxtLink>
      </aside>

      <div class="flex-1">
        <NuxtPage />
      </div>
    </div>
  </AppPageLayout>
</template>
