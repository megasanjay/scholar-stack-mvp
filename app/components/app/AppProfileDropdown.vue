<script setup lang="ts">
const { clear, user } = useUserSession();
const route = useRoute();

const logout = async () => {
  clear();
  await navigateTo("/login");
};

const items = ref([
  [
    {
      label: `${user?.value?.givenName} ${user?.value?.familyName}`,
      avatar: {
        src: `https://api.dicebear.com/9.x/shapes/svg?seed=${user?.value?.id}`,
      },
      type: "label",
    },
    {
      icon: "material-symbols:account-circle",
      label: "Account settings",
      to: "/account/settings",
    },
  ],
  [
    {
      icon: "material-symbols:dashboard",
      label: "Dashboard",
      to: "/dashboard",
    },
    {
      icon: "material-symbols:home",
      label: "Home page",
      to: "/",
    },
  ],
  [
    {
      icon: "material-symbols:add-circle",
      label: "Create a new workspace",
    },
    {
      icon: "material-symbols:star",
      label: "Starred collections",
      to: "/collections/starred",
    },
    {
      icon: "material-symbols:visibility-off",
      label: "Hidden collections",
      to: `/dashboard/workspaces/${route.params.workspaceid}/settings/hidden-collections`,
      disabled: !route.params.workspaceid,
    },
  ],
  [
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
    <template #default="{ loggedIn }">
      <NuxtLink v-if="!loggedIn" to="/login">
        <UButton size="lg" label="Log in" />
      </NuxtLink>

      <NuxtLink v-if="!loggedIn" to="/register">
        <UButton size="lg" label="Get started" />
      </NuxtLink>

      <UDropdownMenu
        :items="items"
        arrow
        :content="{
          align: 'end',
        }"
        :ui="{
          content: 'w-48',
        }"
      >
        <UButton
          v-if="loggedIn"
          :avatar="{
            src: `https://api.dicebear.com/9.x/shapes/svg?seed=${user?.id}`,
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
