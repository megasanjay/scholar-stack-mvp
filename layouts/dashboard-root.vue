<script setup lang="ts">
const devMode = process.env.NODE_ENV === "development";
</script>

<template>
  <div
    class="relative mx-auto flex h-full min-h-screen w-full flex-col bg-zinc-50 dark:bg-zinc-900"
    :class="{ 'debug-screens': devMode }"
  >
    <header class="z-10">
      <nav
        class="border-b border-gray-200 bg-white px-4 py-2.5 lg:px-6 dark:border-gray-700 dark:bg-zinc-800"
      >
        <div class="mx-auto flex flex-wrap items-center justify-between">
          <NuxtLink
            to="/"
            class="flex flex-row items-center justify-start gap-2"
          >
            <span class="text-xl font-bold"> SciConnect </span>
          </NuxtLink>

          <HeaderRightBar />
        </div>
      </nav>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>
