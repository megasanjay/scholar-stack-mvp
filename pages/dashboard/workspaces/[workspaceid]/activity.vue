<script setup lang="ts">
definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});
</script>

<template>
  <main class="h-full bg-zinc-50">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <h1>Activity</h1>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">content</div>
  </main>
</template>
