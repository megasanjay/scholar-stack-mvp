<script lang="ts" setup>
import { computed } from "vue";
import type { EdgeProps } from "@vue-flow/core";
import { BaseEdge, getSmoothStepPath } from "@vue-flow/core";

const props = defineProps<EdgeProps>();

const path = computed(() => getSmoothStepPath(props));
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<template>
  <BaseEdge :path="path[0]" />
</template>

<style>
.edgebutton {
  border-radius: 999px;
  cursor: pointer;
}

.edgebutton:hover {
  box-shadow:
    0 0 0 2px pink,
    0 0 0 4px #f05f75;
}
</style>
