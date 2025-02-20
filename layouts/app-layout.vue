<script setup lang="ts">
const route = useRoute();

const devMode = process.env.NODE_ENV === "development";

const currentLayout = computed(() => {
  if (route.params.resourceid) {
    return "resource-layout";
  }

  if (route.params.collectionid) {
    return "collections-layout";
  }

  if (route.params.workspaceid) {
    return "workspace-layout";
  }

  return "default-layout";
});
</script>

<template>
  <div
    class="relative mx-auto flex h-screen w-full flex-col"
    :class="{ 'debug-screens': devMode }"
  >
    <header class="z-10">
      <nav
        class="flex w-full flex-col-reverse border-b border-gray-200 bg-white pt-2.5"
      >
        <div>
          <HeaderWorkspacesSubMenu
            v-if="currentLayout === 'workspace-layout'"
            :key="$route.fullPath"
            class="px-4 lg:px-6"
          />

          <HeaderCollectionsSubMenu
            v-if="
              currentLayout === 'collections-layout' ||
              currentLayout === 'resource-layout'
            "
            :key="$route.fullPath"
            class="px-4 lg:px-6"
            :class="{
              'border-b border-gray-200': currentLayout === 'resource-layout',
            }"
          />
        </div>

        <div class="flex w-full items-center justify-between px-4 lg:px-6">
          <HeaderLeftBar />

          <HeaderRightBar />
        </div>
      </nav>
    </header>

    <div class="px-3">
      <slot />
    </div>
  </div>
</template>
