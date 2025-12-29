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
  <div>
    <UHeader title="" to="/">
      <template #left>
        <HeaderLeftBar />
      </template>
      <template #right>
        <HeaderRightBar />
      </template>
    </UHeader>

    <UContainer>
      <HeaderWorkspacesSubMenu
        v-if="currentLayout === 'workspace-layout'"
        :key="route.fullPath"
      />

      <HeaderCollectionsSubMenu
        v-if="
          currentLayout === 'collections-layout' ||
          currentLayout === 'resource-layout'
        "
        :key="route.fullPath"
      />
    </UContainer>
    <USeparator />

    <UMain>
      <slot />
    </UMain>
  </div>
</template>
