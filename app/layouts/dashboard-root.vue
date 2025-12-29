<script setup lang="ts">
const devMode = process.env.NODE_ENV === "development";
</script>

<template>
  <div>
    <UHeader title="SciConnect" to="/" class="w-full">
      <template #right>
        <HeaderRightBar />
      </template>
    </UHeader>

    <UMain>
      <slot />
    </UMain>
  </div>
</template>
