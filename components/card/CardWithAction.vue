<script setup lang="ts">
defineProps({
  title: {
    default: "Card Title",
    type: String,
  },
});
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white shadow-lg">
    <div
      class="flex items-center justify-between rounded-t-lg px-6 pb-3 pt-5 transition-all"
    >
      <h2 class="text-lg font-medium">{{ title }}</h2>

      <div class="flex items-center">
        <slot name="header-extra"></slot>
      </div>
    </div>

    <div class="px-6 pb-7">
      <slot></slot>
    </div>

    <div class="rounded-b-lg border-t bg-slate-50 px-6 py-3">
      <slot name="action"></slot>
    </div>
  </div>
</template>
