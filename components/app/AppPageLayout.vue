<script setup lang="ts">
const props = defineProps({
  title: {
    default: "Page Title",
    type: String,
  },
});

const titleExists = computed(() => !!props.title);
</script>

<template>
  <div>
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        v-if="titleExists"
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <h1 class="text-4xl font-black">{{ title }}</h1>
      </div>

      <slot v-else name="header" />
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 py-10 lg:px-20">
      <slot />
    </div>
  </div>
</template>
