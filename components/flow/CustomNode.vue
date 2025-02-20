<script lang="ts" setup>
import { faker } from "@faker-js/faker";

defineProps({
  id: {
    required: true,
    type: String,
  },
  label: {
    required: true,
    type: String,
  },
});

const col = ref(faker.color.rgb());
</script>

<template>
  <div
    class="flex h-full max-w-[200px] flex-col gap-3 rounded border border-solid bg-white p-4 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md"
    :style="{
      borderColor: col,
    }"
  >
    <span class="text-center text-sm"> {{ label }} </span>
  </div>
</template>
