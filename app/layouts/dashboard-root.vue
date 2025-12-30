<script setup lang="ts"></script>

<template>
  <div>
    <UHeader>
      <template #left>
        <NuxtLink to="/">
          <AppLogo class="h-6 w-auto" />
        </NuxtLink>
      </template>

      <template #right>
        <HeaderRightBar />
      </template>
    </UHeader>

    <UMain>
      <slot />
    </UMain>
  </div>
</template>
