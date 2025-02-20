<script setup lang="ts">
const { clear } = useUserSession();

const logout = async () => {
  clear();
  await navigateTo("/login");
};

const items = ref([
  [
    {
      icon: "uil:dashboard",
      label: "Dashboard",
    },
    {
      icon: "bx:bxs-book-open",
      label: "Catalog",
    },
    {
      icon: "ic:baseline-settings",
      label: "Settings",
    },
    {
      icon: "heroicons-solid:star",
      label: "Starred",
    },
  ],
  [
    {
      icon: "solar:home-bold",
      label: "Home",
    },
    {
      icon: "majesticons:logout",
      label: "Logout",
      onSelect: logout,
    },
  ],
]);
</script>

<template>
  <AuthState>
    <template #default="{ loggedIn, user }">
      <NuxtLink v-if="!loggedIn" to="/login">
        <UButton size="lg" label="Log in" />
      </NuxtLink>

      <NuxtLink v-if="!loggedIn" to="/register">
        <UButton size="lg" label="Get started" />
      </NuxtLink>

      <UDropdownMenu
        :items="items"
        :ui="{
          content: 'w-48',
        }"
      >
        <UButton
          v-if="loggedIn"
          :avatar="{
            src: `https://api.dicebear.com/6.x/shapes/svg?seed=${user?.id}`,
          }"
          size="xl"
          color="neutral"
          variant="ghost"
        />
      </UDropdownMenu>
    </template>

    <template #placeholder>
      <!-- this will be rendered on server side -->
      <USkeleton class="h-12 w-12 rounded-full" />
    </template>
  </AuthState>
</template>
