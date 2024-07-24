<script setup>
import { provide } from "vue";

const props = defineProps({
  offsetX: {
    default: -1,
    type: Number,
  },
  offsetY: {
    default: -1,
    type: Number,
  },
  size: {
    default: 64,
    type: Number,
  },
});

const id = Math.round(Math.random() * 999);

provide("grid-context", props);
</script>

<template>
  <svg>
    <defs>
      <pattern
        :id="`grid-pattern-${id}`"
        viewBox="0 0 64 64"
        :width="size"
        :height="size"
        patternUnits="userSpaceOnUse"
        :x="offsetX"
        :y="offsetY"
      >
        <path d="M64 0H0V64" fill="none" />
      </pattern>
    </defs>

    <rect
      width="100%"
      height="100%"
      stroke-width="0"
      :fill="`url(#grid-pattern-${id})`"
    ></rect>

    <slot />
  </svg>
</template>
