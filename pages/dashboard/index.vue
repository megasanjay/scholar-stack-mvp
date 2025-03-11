<script setup lang="ts">
import { useWorkspaceStore } from "@/stores/workspace";

definePageMeta({
  layout: "dashboard-root",
  middleware: ["auth"],
});

useSeoMeta({
  title: "Dashboard",
});

const toast = useToast();

const workspaceStore = useWorkspaceStore();

const filterText = ref("");

const { data: workspaces, error } = await useFetch("/api/workspaces", {});

if (error.value) {
  console.log(error.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    icon: "material-symbols:error",
  });

  navigateTo("/");
}

const personalWorkspace = workspaces.value?.find(
  (workspace) => workspace.personal,
);

const filteredWorkspaces = computed(() => {
  if (workspaces.value) {
    // Remove personal workspace if it exists
    const otherWorkspaces = workspaces.value.filter(
      (workspace) => !workspace.personal,
    );

    if (filterText.value) {
      return otherWorkspaces.filter((workspace) =>
        workspace.title.toLowerCase().includes(filterText.value.toLowerCase()),
      );
    }

    return otherWorkspaces;
  } else {
    return [];
  }
});

workspaceStore.setWorkspaces(workspaces.value || []);
</script>

<template>
  <AppPageLayout>
    <template #header>
      <div class="flex w-full items-center justify-between gap-2">
        <h1 class="text-4xl font-black">Dashboard</h1>

        <UButton
          color="primary"
          icon="mdi:plus"
          @click="workspaceStore.showNewWorkspaceModal"
        >
          <span class="w-max"> Create a new workspace </span>
        </UButton>
      </div>
    </template>

    <div>
      <h2 class="text-2xl font-bold">Your personal workspace</h2>

      <NuxtLink
        :to="`/dashboard/workspaces/${personalWorkspace?.id}`"
        class="mt-4 flex w-full items-center justify-between gap-4 rounded-md border border-slate-300 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-zinc-800"
      >
        <div class="flex items-center gap-3">
          <UAvatar
            size="sm"
            :src="`https://api.dicebear.com/7.x/shapes/svg?seed=${personalWorkspace?.id}`"
            class="mt-1"
          />

          <span class="font-medium">
            {{ personalWorkspace?.title }}
          </span>
        </div>

        <UBadge
          v-if="personalWorkspace?.personal"
          color="warning"
          variant="outline"
        >
          Personal
        </UBadge>
      </NuxtLink>
    </div>

    <USeparator class="pt-10" />

    <div class="flex flex-col gap-5 py-5">
      <h2 class="text-2xl font-bold">Your other workspaces</h2>

      <UInput
        v-model="filterText"
        placeholder="Filter..."
        icon="iconamoon:search-duotone"
        size="lg"
        type="search"
      />

      <div class="grid grid-cols-1 gap-5">
        <NuxtLink
          v-for="workspace in filteredWorkspaces"
          :key="workspace.id"
          :to="`/dashboard/workspaces/${workspace.id}`"
          class="flex w-full flex-col gap-3 rounded-md border border-slate-300 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-zinc-800"
        >
          <div class="flex w-full items-start justify-start gap-2">
            <UAvatar
              size="md"
              :src="`https://api.dicebear.com/7.x/shapes/svg?seed=${workspace.id}`"
              class="mt-1"
            />

            <div class="flex w-full flex-col gap-1">
              <span class="font-medium">
                {{ workspace.title }}
              </span>

              <span class="text-sm">
                {{ workspace.description }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <ModalNewWorkspace />
  </AppPageLayout>
</template>
