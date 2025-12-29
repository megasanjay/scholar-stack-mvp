<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
const route = useRoute();

const navItems: NavigationMenuItem[] = [
  {
    label: "Collections",
    to: `/dashboard/workspaces/${route.params.workspaceid}`,
    icon: "material-symbols:home-outline",
    active:
      route.path === `/dashboard/workspaces/${route.params.workspaceid}`
        ? true
        : false,
  },
  {
    label: "Settings",
    to: `/dashboard/workspaces/${route.params.workspaceid}/settings`,
    icon: "material-symbols:settings-outline",
    active: route.path.startsWith(
      `/dashboard/workspaces/${route.params.workspaceid}/settings`,
    ),
  },
];
</script>

<template>
  <UNavigationMenu :items="navItems" />
</template>
