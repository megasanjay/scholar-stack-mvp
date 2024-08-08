<script setup lang="ts">
const user = useSupabaseUser();

const loggedIn = computed(() => user.value);
const devMode = process.env.NODE_ENV === "development";
</script>

<template>
  <div
    class="relative mx-auto flex h-screen w-full flex-col"
    :class="{ 'debug-screens': devMode }"
  >
    <header>
      <nav
        class="border-b border-gray-200 bg-white px-4 py-2.5 lg:px-6 dark:bg-stone-900"
      >
        <div
          class="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between"
        >
          <NuxtLink
            to="/"
            class="flex flex-row items-center justify-start space-x-2"
          >
            <img src="/logo/logo.svg" alt="Logo" class="mr-2 w-10" />

            <span class="text-xl font-bold dark:text-stone-50"> SciTrace </span>
          </NuxtLink>

          <div class="flex items-center gap-3 lg:order-2">
            <UiColorModeToggle />

            <nuxt-link v-if="loggedIn && devMode" to="/dashboard">
              <n-button color="black" class="dark:text-white" size="large">
                Dashboard
              </n-button>
            </nuxt-link>

            <UiProfileDropdown />
          </div>
        </div>
      </nav>
    </header>

    <slot />
  </div>
</template>
