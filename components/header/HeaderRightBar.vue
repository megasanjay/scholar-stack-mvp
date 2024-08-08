<script setup lang="ts"></script>

<template>
  <div class="flex items-center space-x-3 lg:order-2">
    <nuxt-link to="/view">
      <n-button size="small"> Catalog </n-button>
    </nuxt-link>

    <NuxtLink class="text-sm text-slate-600 hover:text-slate-800" to="/docs">
      Docs
    </NuxtLink>

    <NuxtLink
      class="text-sm text-slate-600 hover:text-slate-800"
      to="/feedback"
    >
      Feedback
    </NuxtLink>

    <n-button tertiary round class="">
      <Icon name="mdi:bell-outline" />
    </n-button>

    <UiColorModeToggle />

    <UiProfileDropdown />
  </div>
</template>
