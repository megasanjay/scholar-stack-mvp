<script setup lang="ts"></script>

<template>
  <div class="flex items-center space-x-3 lg:order-2">
    <nuxt-link to="/view">
      <n-button size="small"> Catalog </n-button>
    </nuxt-link>

    <NuxtLink
      class="text-sm text-slate-600 hover:text-slate-800"
      to="/dashboard"
    >
      Dashboard
    </NuxtLink>

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

    <button
      data-collapse-toggle="mobile-menu-2"
      type="button"
      class="ml-1 inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 lg:hidden"
      aria-controls="mobile-menu-2"
      aria-expanded="false"
    >
      <span class="sr-only">Open main menu</span>

      <svg
        class="h-6 w-6"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clip-rule="evenodd"
        ></path>
      </svg>

      <svg
        class="hidden h-6 w-6"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        ></path>
      </svg>
    </button>
  </div>
</template>
