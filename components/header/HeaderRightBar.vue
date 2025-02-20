<script setup lang="ts"></script>

<template>
  <div class="flex items-center gap-3">
    <ULink to="/view">
      <UButton size="sm" variant="outline"> Catalog </UButton>
    </ULink>

    <ULink to="/docs"> Docs </ULink>

    <ULink to="/feedback"> Feedback </ULink>

    <UButton variant="ghost" color="neutral">
      <Icon name="mdi:bell-outline" />
    </UButton>

    <AppColorModeButton />

    <AppProfileDropdown />
  </div>
</template>
