<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

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

const leftNavItems: NavigationMenuItem[] = [
  {
    label: "Overview",
    to: `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}`,
    icon: "material-symbols:overview-key-outline-rounded",
    active:
      route.path ===
      `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}`
        ? true
        : false,
  },
  {
    label: "Resources",
    to: `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/resources`,
    icon: "cil:list",
    active: route.path.startsWith(
      `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/resources`,
    ),
  },
  {
    label: "Relations",
    to: `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/relations`,
    icon: "icon-park-twotone:connection-point-two",
    active: route.path.startsWith(
      `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/relations`,
    ),
  },
  {
    label: "Creators",
    to: `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/creators`,
    icon: "mdi:people",
    active: route.path.startsWith(
      `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/creators`,
    ),
  },
  {
    label: "Changelog",
    to: `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/changelog`,
    icon: "mdi:history",
    active: route.path.startsWith(
      `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/changelog`,
    ),
  },
];

const rightNavItems: NavigationMenuItem[] = [
  {
    label: "Publish",
    to: `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/publish`,
    icon: "entypo:publish",
    active: route.path.startsWith(
      `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/publish`,
    ),
  },
  {
    label: "Settings",
    to: `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/settings`,
    icon: "material-symbols:settings-outline",
    active: route.path.startsWith(
      `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/settings`,
    ),
  },
];
</script>

<template>
  <div class="flex items-center justify-between">
    <UNavigationMenu :items="leftNavItems" />
    <UNavigationMenu :items="rightNavItems" />
  </div>
</template>
