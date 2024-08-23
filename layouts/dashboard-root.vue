<script setup lang="ts">
const devMode = process.env.NODE_ENV === "development";
</script>

<template>
  <div
    class="relative mx-auto flex h-screen w-full flex-col"
    :class="{ 'debug-screens': devMode }"
  >
    <header>
      <nav class="border-b border-gray-200 bg-white px-4 py-2.5 lg:px-6">
        <div class="mx-auto flex flex-wrap items-center justify-between">
          <NuxtLink
            to="/"
            class="flex flex-row items-center justify-start space-x-2"
          >
            <img src="/logo/logo.svg" alt="Logo" class="mr-2 w-10" />

            <span class="text-xl font-bold"> SciConnect </span>
          </NuxtLink>

          <HeaderRightBar />
        </div>
      </nav>
    </header>

    <slot />
  </div>
</template>
