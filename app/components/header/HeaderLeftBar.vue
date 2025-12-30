<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import { useWorkspaceStore } from "@/stores/workspace";

const toast = useToast();
const route = useRoute();

const workspaceStore = useWorkspaceStore();
const collectionStore = useCollectionStore();
const resourceStore = useResourceStore();

const selectedWorkspace = ref("");
const selectedCollection = ref(0);
const selectedResource = ref("");

const personalWorkspace = computed(() => {
  return workspaceStore.workspaces.find(
    (workspace: Workspace) => workspace.personal,
  );
});

const allOtherWorkspaces = computed(() => {
  return workspaceStore.workspaces.filter(
    (workspace: Workspace) => !workspace.personal,
  );
});

const currentWorkspace = computed(() => {
  const allWorkspaces = workspaceStore.workspaces;

  return allWorkspaces.find(
    (workspace: Workspace) => workspace.id === selectedWorkspace.value,
  );
});

const allCollections = computed(() => {
  return collectionStore.collections;
});

const currentCollection = computed(() => {
  const allCollections = collectionStore.collections;

  return allCollections.find(
    (collection: Collection) => collection.id === selectedCollection.value,
  );
});

const allResources = computed(() => {
  return resourceStore.resources;
});

const currentResource = computed(() => {
  const allResources = resourceStore.resources;

  return allResources.find(
    (resource: ResourceType) => resource.id === selectedResource.value,
  );
});

const fetchAllWorkspaces = async (workspaceid: string) => {
  if (workspaceid === currentWorkspace.value?.id) return;

  workspaceStore.getLoading = true;

  const { data: workspaces, error } = await useFetch("/api/workspaces", {});

  workspaceStore.getLoading = false;

  if (error.value) {
    console.log(error);

    toast.add({
      title: "Something went wrong",
      color: "error",
      description: "We couldn't load your workspaces",
      icon: "material-symbols:error",
    });
  }

  if (workspaces.value) {
    workspaceStore.setWorkspaces(
      workspaces.value?.length > 0 ? (workspaces.value as Workspace[]) : [],
    );

    workspaceStore.sortWorkspaces();
  }
};

const fetchAllCollections = async (
  workspaceid: string,
  collectionid: number = 0,
) => {
  if (collectionid === currentCollection.value?.id) return;

  collectionStore.getLoading = true;

  const { data: workspace, error } = await useFetch(
    `/api/workspaces/${workspaceid}`,
    {},
  );

  collectionStore.getLoading = false;

  if (error.value) {
    console.log(error);

    toast.add({
      title: "Something went wrong",
      color: "error",
      description: "We couldn't load your collections",
      icon: "material-symbols:error",
    });
  }

  if (workspace.value) {
    collectionStore.setCollections(
      workspace.value?.collections.length > 0
        ? workspace.value.collections
        : [],
    );

    collectionStore.sortCollections();
  }
};

const fetchAllResources = async (
  workspaceid: string,
  collectionid: number,
  resourceid: string = "",
) => {
  if (resourceid === currentResource.value?.id) return;
  resourceStore.getLoading = true;

  const { data: collection, error } = await useFetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}`,
    {},
  );

  resourceStore.getLoading = false;

  if (error.value) {
    console.log(error);

    toast.add({
      title: "Something went wrong",
      color: "error",
      description: "We couldn't load your resources",
      icon: "material-symbols:error",
    });
  }

  if (collection.value) {
    resourceStore.setResources(
      collection.value?.resources.length > 0
        ? (collection.value.resources as ResourceType[])
        : [],
    );

    resourceStore.sortResources();
  }
};

// watch for route changes and update selected workspace
watchEffect(() => {
  const workspaceid = route.params.workspaceid;
  const collectionid = route.params.collectionid;
  const resourceid = route.params.resourceid;

  if (workspaceid) {
    selectedWorkspace.value = workspaceid as string;
    fetchAllWorkspaces(workspaceid as string);
  }

  if (collectionid) {
    selectedCollection.value = parseInt(collectionid as string);
    fetchAllCollections(
      workspaceid as string,
      parseInt(collectionid as string),
    );
  }

  if (resourceid) {
    selectedResource.value = resourceid as string;
    fetchAllResources(
      workspaceid as string,
      parseInt(collectionid as string),
      resourceid as string,
    );
  }
});

const navigateToWorkspace = (workspaceid: string) => {
  navigateTo(`/dashboard/workspaces/${workspaceid}`);

  fetchAllCollections(workspaceid);
};

const createNewWorkspace = () => {
  workspaceStore.showNewWorkspaceModal();
};

const navigateToCollection = (collectionid: number) => {
  navigateTo(
    `/dashboard/workspaces/${selectedWorkspace.value}/collections/${collectionid}`,
  );

  fetchAllResources(selectedWorkspace.value, collectionid);
};

const createNewCollection = () => {
  collectionStore.showNewCollectionModal();
};

const navigateToResource = (resourceid: string) => {
  navigateTo(
    `/dashboard/workspaces/${selectedWorkspace.value}/collections/${selectedCollection.value}/resources/${resourceid}`,
  );
};

const workspaceItems = ref<DropdownMenuItem[][]>([
  [
    {
      label: "My Personal Workspace",
      id: personalWorkspace.value?.id || "",
      avatar: {
        src: `https://api.dicebear.com/9.x/identicon/svg?seed=${personalWorkspace.value?.id}`,
      },
      // to: `/dashboard/workspaces/${personalWorkspace.value?.id || ""}`,
      onSelect: () => {
        navigateToWorkspace(personalWorkspace.value?.id || "");
      },
    },
  ],
  ...(allOtherWorkspaces.value.length
    ? [
        allOtherWorkspaces.value.map((workspace: Workspace) => ({
          id: workspace.id,
          label: workspace.title,
          avatar: {
            src: `https://api.dicebear.com/9.x/identicon/svg?seed=${workspace.id}`,
          },
          // to: `/dashboard/workspaces/${workspace.id}`,
          onSelect: () => {
            navigateToWorkspace(workspace.id);
          },
        })),
      ]
    : []),
  [
    {
      label: "Create a new workspace",
      // to: "/dashboard/workspaces/new",
      onSelect: createNewWorkspace,
      icon: "ph:plus-circle-bold",
    },
  ],
]);

const collectionItems = computed<DropdownMenuItem[][]>(() => [
  ...(allCollections.value.length
    ? [
        allCollections.value.map((collection: Collection) => ({
          label: collection.title,
          avatar: {
            src: `https://api.dicebear.com/9.x/shapes/svg?seed=${collection.id}`,
          },
          onSelect: () => {
            navigateToCollection(collection.id);
          },
        })),
      ]
    : []),
  [
    {
      label: "Create a new collection",
      onSelect: createNewCollection,
      icon: "ph:plus-circle-bold",
    },
  ],
]);

const resourceItems = computed<DropdownMenuItem[][]>(() => [
  ...(allResources.value.length
    ? [
        allResources.value.map((resource: ResourceType) => ({
          label: resource.title,
          onSelect: () => {
            navigateToResource(resource.id);
          },
        })),
      ]
    : []),
]);
</script>

<template>
  <div class="flex items-center justify-start">
    <!-- Logo -->
    <div>
      <NuxtLink to="/dashboard">
        <AppLogoIcon class="h-5 w-5" />
      </NuxtLink>
    </div>

    <!-- First / -->
    <TransitionFade>
      <UIcon
        v-if="route.params.workspaceid"
        name="heroicons:slash-16-solid"
        class="h-6 w-6 text-gray-200"
      />
    </TransitionFade>

    <!-- Workspaces -->
    <div class="flex items-center justify-start gap-2">
      <ContainerFlex align="center">
        <NuxtLink :to="`/dashboard/workspaces/${currentWorkspace?.id}`">
          <TransitionFade>
            <div
              v-if="workspaceStore.getLoading"
              class="flex items-center justify-start gap-2"
            >
              <USkeleton
                v-if="workspaceStore.getLoading"
                class="h-[25px] w-[100px]"
              />
            </div>

            <div
              v-else
              class="flex items-center justify-start gap-2 rounded-md p-1 transition-all hover:bg-gray-50"
            >
              <span
                class="max-w-40 truncate text-sm font-medium transition-all hover:text-gray-600"
              >
                {{ currentWorkspace?.title }}
              </span>
            </div>
          </TransitionFade>
        </NuxtLink>

        <UDropdownMenu
          :items="workspaceItems"
          :ui="{
            content: 'w-max',
          }"
        >
          <UButton icon="mingcute:down-fill" color="neutral" variant="ghost" />

          <template #item-trailing="{ item }">
            <UIcon
              v-if="item.id === currentWorkspace?.id"
              name="streamline:check-solid"
              class="mt-1 ml-1 size-3"
            />
          </template>
        </UDropdownMenu>
      </ContainerFlex>
    </div>

    <!-- Second / -->
    <TransitionFade>
      <UIcon
        v-if="route.params.collectionid"
        name="heroicons:slash-16-solid"
        class="h-6 w-6 text-gray-200"
      />
    </TransitionFade>

    <!-- Collections -->
    <TransitionFade>
      <div
        v-if="route.params.collectionid"
        class="flex items-center justify-start gap-2"
      >
        <ContainerFlex align="center">
          <NuxtLink
            :to="`/dashboard/workspaces/${currentWorkspace?.id}/collections/${selectedCollection}`"
          >
            <TransitionFade>
              <div
                v-if="collectionStore.getLoading"
                class="flex items-center justify-start gap-2"
              >
                <USkeleton class="h-[25px] w-[100px]" />
              </div>

              <div
                v-else
                class="flex items-center justify-start gap-2 rounded-md p-1 transition-all hover:bg-gray-50"
              >
                <span
                  class="max-w-40 truncate text-sm font-medium transition-all hover:text-gray-600"
                >
                  {{ currentCollection?.title }}
                </span>
              </div>
            </TransitionFade>
          </NuxtLink>

          <UDropdownMenu
            :items="collectionItems"
            :ui="{
              content: 'w-max',
            }"
          >
            <UButton
              icon="mingcute:down-fill"
              color="neutral"
              variant="ghost"
            />
          </UDropdownMenu>
        </ContainerFlex>
      </div>
    </TransitionFade>

    <!-- Third / -->
    <TransitionFade>
      <UIcon
        v-if="route.params.resourceid"
        name="heroicons:slash-16-solid"
        class="h-6 w-6 text-gray-200"
      />
    </TransitionFade>

    <!-- Resources -->
    <TransitionFade>
      <div
        v-if="route.params.resourceid"
        class="flex items-center justify-start gap-2"
      >
        <ContainerFlex align="center">
          <NuxtLink
            :to="`/dashboard/workspaces/${currentWorkspace?.id}/collections/${selectedCollection}/resources/${selectedResource}`"
          >
            <TransitionFade>
              <div
                v-if="resourceStore.getLoading"
                class="flex items-center justify-start gap-2"
              >
                <USkeleton class="h-[25px] w-[100px]" />
              </div>

              <div
                v-else
                class="flex items-center justify-start gap-2 rounded-md p-1 transition-all hover:bg-gray-50"
              >
                <span
                  v-if="currentResource?.title"
                  class="max-w-40 truncate text-sm font-medium transition-all hover:text-gray-600"
                >
                  {{ currentResource?.title }}
                </span>

                <UBadge
                  v-else
                  color="success"
                  size="sm"
                  class="pointer-events-none"
                  variant="outline"
                >
                  New
                </UBadge>
              </div>
            </TransitionFade>
          </NuxtLink>

          <UDropdownMenu
            :items="resourceItems"
            :ui="{
              content: 'w-max',
            }"
          >
            <UButton
              icon="mingcute:down-fill"
              color="neutral"
              variant="ghost"
            />
          </UDropdownMenu>
        </ContainerFlex>
      </div>
    </TransitionFade>

    <ModalNewWorkspace />

    <ModalNewCollection v-if="route.params.collectionid" />
  </div>
</template>
