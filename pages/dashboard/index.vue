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

workspaceStore.setWorkspaces(workspaces.value || []);
</script>

<template>
  <main class="h-full bg-zinc-50 dark:bg-zinc-900">
    <div
      class="flex h-36 items-center border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-zinc-800"
    >
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <h1 class="text-4xl font-black">Dashboard</h1>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <div class="flex items-center justify-between gap-4 py-10">
        <UInput
          placeholder="Search..."
          icon="iconamoon:search-duotone"
          size="lg"
          type="search"
        />

        <UButton
          color="primary"
          icon="mdi:plus"
          @click="workspaceStore.showNewWorkspaceModal"
        >
          <span class="w-max"> Create a new workspace </span>
        </UButton>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <ULink
          v-for="workspace in workspaces"
          :key="workspace.id"
          :to="`/dashboard/workspaces/${workspace.id}`"
          class="flex w-full flex-col space-y-4 rounded-md border border-slate-200 bg-white px-6 py-5 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-zinc-800"
        >
          <div class="flex w-full items-start justify-start space-x-2">
            <UAvatar
              size="xl"
              :src="`https://api.dicebear.com/7.x/shapes/svg?seed=${workspace.id}`"
            />

            <div class="flex flex-col">
              <div class="flex items-center justify-between gap-2">
                <span class="text-lg font-medium">
                  {{ workspace.title }}
                </span>

                <UBadge
                  v-if="workspace.personal"
                  color="warning"
                  variant="outline"
                >
                  Personal
                </UBadge>
              </div>

              <span class="text-sm">
                Created on
                {{ $dayjs(workspace.created).format("MMMM DD, YYYY") }}
              </span>
            </div>
          </div>

          <div>
            <span>
              {{ workspace.description }}
            </span>
          </div>
        </ULink>
      </div>
    </div>

    <ModalNewWorkspace />
  </main>
</template>
