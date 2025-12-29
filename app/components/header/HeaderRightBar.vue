<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();

const headerItems: NavigationMenuItem[] = [
  {
    label: "Catalog",
    to: "/view",
    active: route.path.startsWith("/view"),
  },
  {
    label: "Documentation",
    to: "/docs",
    active: route.path.startsWith("/docs"),
  },
  {
    label: "Feedback",
    to: "/feedback",
    active: route.path.startsWith("/feedback"),
  },
  {
    icon: "mdi:bell-outline",
  },
];
</script>

<template>
  <div class="flex items-center gap-3">
    <UNavigationMenu :items="headerItems" />

    <UColorModeButton />

    <AppProfileDropdown />
  </div>
</template>
