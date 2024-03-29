<script setup lang="ts">
const colorMode = useColorMode();

const isDark = computed({
  get() {
    return colorMode.value === "dark";
  },
  set() {
    colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
  },
});
</script>

<template>
  <ClientOnly>
    <UButton
      :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
      color="gray"
      aria-label="Theme"
      @click="isDark = !isDark"
    />

    <template #fallback>
      <!-- this will be rendered on server side -->
      <n-spin size="small">
        <div class="h-8 w-8 rounded-full"></div>
      </n-spin>
    </template>
  </ClientOnly>
</template>
