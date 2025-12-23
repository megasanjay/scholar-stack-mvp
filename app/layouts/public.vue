<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const footerItems: NavigationMenuItem[] = [
  {
    label: "Made with ♥ by the FAIR Data Innovations Hub",
  },
];
</script>

<template>
  <div>
    <AppPublicHeader />
    public layout header

    <UMain>
      <slot />
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-muted text-sm">
          Copyright © {{ new Date().getFullYear() }}
        </p>
      </template>

      <UNavigationMenu :items="footerItems" variant="link" color="primary" />

      <template #right>
        <UColorModeButton />

        <UButton
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          to="https://github.com/fairdataihub/sciconnect"
          target="_blank"
          aria-label="GitHub"
        />

        <UButton
          icon="i-simple-icons-linkedin"
          color="neutral"
          variant="ghost"
          to="https://www.linkedin.com/company/fairdataihub"
          target="_blank"
          aria-label="LinkedIn"
        />
      </template>
    </UFooter>
  </div>
</template>
