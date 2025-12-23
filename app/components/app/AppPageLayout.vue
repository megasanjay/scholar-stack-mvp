<script setup lang="ts">
defineProps({
  title: {
    default: "Page Title",
    type: String,
  },
});
const slots: any = useSlots();
</script>

<template>
  <div>
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <slot v-if="slots.header" name="header" />

        <h1 v-else class="text-4xl font-black">{{ title }}</h1>
      </div>
    </div>

    <div class="mx-auto h-full w-full max-w-screen-xl px-2.5 py-10 lg:px-20">
      <slot />
    </div>
  </div>
</template>
