<script setup lang="ts">
definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const route = useRoute();
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader title="Workspace Settings" />

      <UPageBody>
        <div>
          <div class="flex w-full items-start justify-start gap-12">
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
      </UPageBody>
    </UPage>
  </UContainer>
</template>
