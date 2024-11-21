<script setup lang="ts">
const props = defineProps({
  title: {
    default: "",
    type: String,
  },
  content: {
    default: "",
    type: String,
  },
  secondary: {
    default: false,
    type: Boolean,
  },
});

const hasContent = computed(() => props.content.length > 0);
</script>

<template>
  <div>
    <h3
      class="pb-1 pt-5"
      :class="{
        'text-stone-500': secondary,
      }"
    >
      {{ title }}
    </h3>

    <p
      v-if="hasContent"
      class="text-lg"
      :class="{
        'text-base text-stone-400': secondary,
      }"
    >
      {{ content }}
    </p>

    <slot v-else />
  </div>
</template>
