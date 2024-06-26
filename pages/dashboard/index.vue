<script setup lang="ts">
import { useWorkspaceStore } from "@/stores/workspace";

definePageMeta({
  layout: "dashboard-root",
  middleware: ["auth"],
});

const workspaceStore = useWorkspaceStore();

const { data: workspaces, error } = await useFetch("/api/workspaces", {
  headers: useRequestHeaders(["cookie"]),
});

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
    message: "Please contact support",
  });

  navigateTo("/");
}

workspaceStore.setWorkspaces(workspaces.value || []);
</script>

<template>
  <main class="h-full bg-zinc-50 px-4">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <h1>Dashboard</h1>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <div class="flex items-center justify-between space-x-4 py-10">
        <n-input placeholder="Search..." size="large">
          <template #prefix>
            <Icon name="iconamoon:search-duotone" size="20" class="mr-2" />
          </template>
        </n-input>

        <n-button
          size="large"
          color="black"
          @click="workspaceStore.showNewWorkspaceModal"
        >
          <template #icon>
            <Icon name="mdi:plus" />
          </template>
          Create a new workspace
        </n-button>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="workspace in workspaces"
          :key="workspace.id"
          :to="`/dashboard/workspaces/${workspace.id}`"
          class="flex w-full flex-col space-y-4 rounded-md border bg-white px-6 py-5 shadow-sm transition-all hover:shadow-md"
        >
          <div class="flex w-full items-center justify-start space-x-2">
            <n-avatar
              :size="40"
              :src="`https://api.dicebear.com/7.x/shapes/svg?seed=${workspace.id}`"
              class="h-[40px] w-[40px] hover:cursor-pointer hover:opacity-80"
            />

            <div class="flex grow flex-col space-y-0">
              <ContainerFlex justify="space-between">
                <span class="text-lg font-medium">
                  {{ workspace.title }}
                </span>

                <n-tag v-if="workspace.personal" type="warning" size="small">
                  Personal
                </n-tag>
              </ContainerFlex>

              <span class="text-sm text-slate-500">
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
        </NuxtLink>
      </div>
    </div>

    <ModalNewWorkspace />
  </main>
</template>
