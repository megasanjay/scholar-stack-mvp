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
      class="pt-5 pb-2 text-lg font-semibold"
      :class="{ '!pb-0 text-stone-400': secondary }"
    >
      {{ title }}
    </h3>

    <p
      v-if="hasContent"
      class="text-lg"
      :class="{ 'text-stone-400': secondary }"
    >
      {{ content }}
    </p>

    <slot v-else />
  </div>
</template>
