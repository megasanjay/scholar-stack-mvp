<script setup>
import { inject } from "vue";

defineProps({
  column: {
    required: true,
    type: Number,
  },
  row: {
    required: true,
    type: Number,
  },
});

const grid = inject("grid-context");
</script>

<template>
  <rect
    stroke-width="0"
    :width="grid.size - 1"
    :height="grid.size - 1"
    :x="column * grid.size + grid.offsetX + 1"
    :y="row * grid.size + grid.offsetY + 1"
  ></rect>
</template>
