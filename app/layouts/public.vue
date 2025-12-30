<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const { clear } = useUserSession();

const footerItems: NavigationMenuItem[] = [
  {
    label: "Made with ♥ by the FAIR Data Innovations Hub",
  },
];

const headerItems: NavigationMenuItem[] = [
  {
    label: "Catalog",
    to: "/view",
    active: route.path.startsWith("/view"),
  },
  {
    label: "Documentation",
    to: "/docs",
    active: route.path.startsWith("/docs"),
  },
  {
    label: "Feedback",
    to: "/feedback",
    active: route.path.startsWith("/feedback"),
  },
  {
    label: "GitHub",
    to: "https://github.com/fairdataihub/sciconnect",
    target: "_blank",
  },
];

const logout = async () => {
  clear();
  await navigateTo("/login");
};
</script>

<template>
  <div>
    <UHeader>
      <template #left>
        <NuxtLink to="/">
          <AppLogo class="h-6 w-auto" />
        </NuxtLink>
      </template>

      <UNavigationMenu :items="headerItems" />

      <template #right>
        <AuthState v-slot="{ loggedIn }">
          <div v-if="loggedIn" class="flex items-center justify-center gap-3">
            <UButton
              to="/dashboard"
              label="Dashboard"
              variant="ghost"
              size="lg"
            />

            <UButton color="neutral" variant="outline" @click="logout">
              Logout
            </UButton>
          </div>

          <div v-else class="flex items-center justify-center gap-3">
            <UButton to="/login" color="neutral" variant="outline">
              Sign in
            </UButton>

            <UButton to="/signup" color="neutral">
              <template #trailing>
                <Icon name="i-heroicons-arrow-right-20-solid" size="20" />
              </template>
              Sign up
            </UButton>
          </div>
        </AuthState>
      </template>
    </UHeader>

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
