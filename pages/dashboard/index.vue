<script setup lang="ts">
import { useWorkspaceStore } from "@/stores/workspace";

definePageMeta({
  layout: "dashboard-root",
  middleware: ["auth"],
});

const push = usePush();
const workspaceStore = useWorkspaceStore();

const gridView = ref(true);

const { data: workspaces, error } = await useFetch("/api/workspaces", {
  headers: useRequestHeaders(["cookie"]),
});

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your workspaces",
  });

  navigateTo("/");
}

if (workspaces.value?.length === 0) {
  console.log("No workspaces found");

  // Create a new personal workspace
  const { data: workspace, error } = await useFetch("/api/workspaces", {
    body: JSON.stringify({
      title: "My workspace",
      description: "This is my personal workspace",
    }),
    headers: useRequestHeaders(["cookie"]),
    method: "POST",
  });

  if (error.value) {
    console.log(error.value);

    push.error({
      title: "Something went wrong",
      message: "Please contact support",
    });

    navigateTo("/");
  }

  if (workspace.value) {
    console.log("Workspace created", workspace.value);

    push.success({
      title: "Workspace created",
      message: "You can now start adding your collections",
    });

    navigateTo(`dashboard/workspaces/${workspace.value.workspaceId}`);
  }
} else {
  console.log("Workspaces found", workspaces.value);
  // navigateTo(`dashboard/workspaces`);
}
</script>

<template>
  <main class="h-full bg-zinc-50">
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

        <n-radio-group
          v-model:value="gridView"
          name="radiobuttongroup1"
          size="large"
          class="bg-white"
        >
          <n-radio-button :value="true">
            <Icon name="mingcute:grid-line" />
          </n-radio-button>

          <n-radio-button :value="false">
            <Icon name="cil:list" />
          </n-radio-button>
        </n-radio-group>

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
          class="flex flex-col space-y-5 rounded-md border bg-white p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div class="flex items-center justify-start space-x-2">
            <n-avatar
              :size="40"
              :src="`https://api.dicebear.com/6.x/shapes/svg?seed=${workspace.id}`"
              class="hover:cursor-pointer hover:opacity-80"
            />

            <div class="flex flex-col space-y-0">
              <span class="text-lg font-medium">
                {{ workspace.title }}
              </span>

              <span class="text-sm text-slate-500">
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