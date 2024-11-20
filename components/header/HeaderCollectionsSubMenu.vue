<script setup lang="ts">
const route = useRoute();

const isResourcePage = computed(() => {
  return route.params.resourceid !== undefined;
});

const {
  data: collection,
  error,
  pending,
} = await useFetch<CollectionGETAPIResponse>(
  `/api/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}`,
  {
    headers: useRequestHeaders(["cookie"]),
    lazy: true,
    server: false,
  },
);

if (error.value) {
  console.error(error.value);
}

const isDraftVersion = computed(() => {
  if (collection.value) {
    if (collection.value.version) {
      return !collection.value.version.published;
    }
  }

  return false;
});
</script>

<template>
  <div class="submenu flex items-center space-x-5 pt-4">
    <NuxtLink
      class="flex items-center space-x-1 text-slate-500"
      active-class="border-b-2 border-slate-800 text-slate-900"
      :to="`/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}`"
    >
      <div
        class="mb-1 flex items-center space-x-2 rounded-md px-2 py-2 transition-all hover:bg-slate-100 hover:text-slate-800"
      >
        <Icon name="material-symbols:overview-key-outline-rounded" />

        <span class="text-sm"> Overview </span>
      </div>
    </NuxtLink>

    <NuxtLink
      class="flex items-center space-x-1 text-slate-500"
      active-class="border-b-2 border-slate-800 text-slate-900"
      :class="{
        'border-b-2 border-slate-800 text-slate-900': isResourcePage,
      }"
      :to="`/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/resources`"
    >
      <div
        class="mb-1 flex items-center space-x-2 rounded-md px-2 py-2 transition-all hover:bg-slate-100 hover:text-slate-800"
      >
        <Icon name="cil:list" />

        <span class="text-sm"> Resources </span>
      </div>
    </NuxtLink>

    <NuxtLink
      class="flex items-center space-x-1 text-slate-500"
      active-class="border-b-2 border-slate-800 text-slate-900"
      :to="`/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/relations`"
    >
      <div
        class="mb-1 flex items-center space-x-2 rounded-md px-2 py-2 transition-all hover:bg-slate-100 hover:text-slate-800"
      >
        <Icon name="icon-park-twotone:connection-point-two" />

        <span class="text-sm"> Relations </span>
      </div>
    </NuxtLink>

    <NuxtLink
      class="flex items-center space-x-1 text-slate-500"
      active-class="border-b-2 border-slate-800 text-slate-900"
      :to="`/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/creators`"
    >
      <div
        class="mb-1 flex items-center space-x-2 rounded-md px-2 py-2 transition-all hover:bg-slate-100 hover:text-slate-800"
      >
        <Icon name="mdi:people" />

        <span class="text-sm"> Creators </span>
      </div>
    </NuxtLink>

    <NuxtLink
      class="flex items-center space-x-1 text-slate-500 transition-all"
      active-class="border-b-2 border-slate-800 text-slate-900"
      :to="`/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/changelog`"
      :class="{
        'cursor-not-allowed': !isDraftVersion || pending,
        'opacity-50': !isDraftVersion || pending,
        'pointer-events-none': !isDraftVersion || pending,
      }"
    >
      <div
        class="mb-1 flex items-center space-x-2 rounded-md px-2 py-2 transition-all hover:bg-slate-100 hover:text-slate-800"
      >
        <Icon :name="pending ? 'svg-spinners:90-ring' : 'mdi:history'" />

        <span class="text-sm"> Changelog </span>
      </div>
    </NuxtLink>

    <NuxtLink
      class="flex items-center space-x-1 text-slate-500 transition-all"
      active-class="border-b-2 border-slate-800 text-slate-900"
      :to="`/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/publish`"
      :class="{
        'cursor-not-allowed': !isDraftVersion || pending,
        'opacity-50': !isDraftVersion || pending,
        'pointer-events-none': !isDraftVersion || pending,
      }"
    >
      <div
        class="mb-1 flex items-center space-x-2 rounded-md px-2 py-2 transition-all hover:bg-slate-100 hover:text-slate-800"
      >
        <Icon :name="pending ? 'svg-spinners:90-ring' : 'entypo:publish'" />

        <span class="text-sm"> Publish </span>
      </div>
    </NuxtLink>

    <NuxtLink
      class="flex items-center space-x-1 text-slate-500"
      active-class="border-b-2 border-slate-800 text-slate-900"
      :to="`/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/settings`"
    >
      <div
        class="mb-1 flex items-center space-x-2 rounded-md px-2 py-2 transition-all hover:bg-slate-100 hover:text-slate-800"
      >
        <Icon name="material-symbols:settings-outline" />

        <span class="text-sm"> Settings </span>
      </div>
    </NuxtLink>
  </div>
</template>
