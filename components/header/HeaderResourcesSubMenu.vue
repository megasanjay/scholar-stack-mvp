<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <div class="submenu flex items-center space-x-5 pt-4">
    <NuxtLink
      class="flex items-center space-x-1 text-slate-500"
      active-class="border-b-2 border-slate-800 text-slate-900"
      :class="{
        'border-b-2 border-slate-800 text-slate-900':
          route.name === 'resource:edit',
      }"
      :to="`/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/resources/${route.params.resourceid}`"
    >
      <div
        class="mb-1 flex items-center space-x-1 rounded-md px-2 py-2 transition-all hover:bg-slate-100 hover:text-slate-800"
      >
        <Icon name="mdi:about-circle-outline" />

        <span class="text-sm"> About </span>
      </div>
    </NuxtLink>

    <NuxtLink
      class="flex items-center space-x-1 text-slate-500"
      active-class="border-b-2 border-slate-800 text-slate-900"
      :class="{
        'border-b-2 border-slate-800 text-slate-900':
          route.name === 'relation:edit',
      }"
      :to="`/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/resources/${route.params.resourceid}/relations`"
    >
      <div
        class="mb-1 flex items-center space-x-1 rounded-md px-2 py-2 transition-all hover:bg-slate-100 hover:text-slate-800"
      >
        <Icon name="icon-park-twotone:connection-point-two" />

        <span class="text-sm"> Relations </span>

        <n-tag type="warning" round size="small">beta</n-tag>
      </div>
    </NuxtLink>
  </div>
</template>
