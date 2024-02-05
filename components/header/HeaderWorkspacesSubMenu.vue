<script setup lang="ts">
const route = useRoute();

const navItems = [
  {
    name: "Collections",
    href: `/dashboard/workspaces/${route.params.workspaceid}`,
    icon: "material-symbols:home-outline",
  },
  {
    name: "Activity",
    href: `/dashboard/workspaces/${route.params.workspaceid}/activity`,
    icon: "mdi:timeline-clock-outline",
  },
  {
    name: "Settings",
    href: `/dashboard/workspaces/${route.params.workspaceid}/settings`,
    icon: "material-symbols:settings-outline",
  },
];
</script>

<template>
  <div class="submenu flex items-center space-x-5 pt-4">
    <NuxtLink
      v-for="item in navItems"
      :key="item.name"
      class="flex items-center space-x-1 text-slate-500"
      active-class="border-b-2 border-slate-800 text-slate-900"
      :to="item.href"
    >
      <div
        class="mb-1 flex items-center space-x-1 rounded-md px-2 py-2 transition-all hover:bg-slate-100 hover:text-slate-800"
      >
        <Icon :name="item.icon" />

        <span class="text-sm">
          {{ item.name }}
        </span>
      </div>
    </NuxtLink>
  </div>
</template>
