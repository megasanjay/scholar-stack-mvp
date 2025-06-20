<script setup lang="ts">
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
      workspaces.value?.length > 0 ? workspaces.value : [],
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
</script>

<template>
  <div class="flex items-center justify-start">
    <div class="w-max">
      <HeadlessListbox v-model="selectedWorkspace">
        <div class="relative">
          <ContainerFlex align="center">
            <NuxtLink :to="`/dashboard/workspaces/${currentWorkspace?.id}`">
              <TransitionFade>
                <div
                  v-if="workspaceStore.getLoading"
                  class="flex items-center justify-start gap-2"
                >
                  <USkeleton class="h-[20px] w-[20px] rounded-full" />

                  <USkeleton
                    v-if="workspaceStore.getLoading"
                    class="h-[25px] w-[100px]"
                  />
                </div>

                <div
                  v-else
                  class="flex items-center justify-start gap-2 rounded-md p-1 transition-all hover:bg-gray-50"
                >
                  <UAvatar
                    :src="`https://api.dicebear.com/6.x/shapes/svg?seed=${currentWorkspace?.id}`"
                    size="sm"
                  />

                  <span
                    class="max-w-40 truncate text-base font-medium transition-all hover:text-gray-600"
                  >
                    {{ currentWorkspace?.title }}
                  </span>

                  <UBadge
                    v-if="currentWorkspace?.personal"
                    color="info"
                    size="sm"
                    class="pointer-events-none"
                    variant="outline"
                  >
                    Personal
                  </UBadge>
                </div>
              </TransitionFade>
            </NuxtLink>

            <HeadlessListboxButton
              class="relative w-full cursor-pointer rounded-lg border border-slate-100 bg-white p-1 text-left transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm sm:text-sm"
            >
              <span
                class="pointer-events-none inset-y-0 right-0 flex items-center"
              >
                <Icon name="ph:caret-up-down-bold" class="h-5 w-5" />
              </span>
            </HeadlessListboxButton>
          </ContainerFlex>

          <transition
            leave-active-class="transition duration-100 ease-in"
            enter-active-class="transition duration-75 ease-out"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
            enter-from-class="opacity-0 transition transform origin-top-right scale-95"
            enter-to-class="opacity-100 transform origin-top-right scale-100"
          >
            <HeadlessListboxOptions
              class="absolute mt-1 max-h-60 w-max overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-slate-300 sm:text-sm"
            >
              <HeadlessListboxOption
                v-slot="{ active, selected }"
                :value="personalWorkspace?.id"
                as="template"
                @click="navigateToWorkspace(personalWorkspace?.id || '')"
              >
                <li
                  :class="[
                    active ? 'bg-amber-100 text-amber-900' : 'text-gray-900',
                    'flex w-full cursor-pointer items-center justify-between px-4 py-2',
                  ]"
                >
                  <div class="flex items-center justify-start gap-2 pr-4">
                    <UAvatar
                      :src="`https://api.dicebear.com/6.x/shapes/svg?seed=${personalWorkspace?.id}`"
                      size="sm"
                    />

                    <span
                      :class="[
                        selected ? 'font-medium' : 'font-normal',
                        'block truncate',
                      ]"
                    >
                      {{ personalWorkspace?.title }}
                    </span>
                  </div>

                  <span
                    v-if="selected"
                    class="flex items-center text-amber-600"
                  >
                    <Icon name="ph:check-bold" class="h-5 w-5" />
                  </span>
                </li>
              </HeadlessListboxOption>

              <div
                v-if="allOtherWorkspaces.length > 0"
                class="mx-auto my-1 h-[1px] w-[90%] bg-slate-200"
              ></div>

              <HeadlessListboxOption
                v-for="(workspace, index) in allOtherWorkspaces"
                v-slot="{ active, selected }"
                :key="index"
                :value="workspace.id"
                as="template"
                @click="navigateToWorkspace(workspace.id)"
              >
                <li
                  :class="[
                    active ? 'bg-amber-100 text-amber-900' : 'text-gray-900',
                    'flex w-full cursor-pointer items-center justify-between px-4 py-2',
                  ]"
                >
                  <div class="flex items-center justify-start gap-2 pr-4">
                    <UAvatar
                      :src="`https://api.dicebear.com/6.x/shapes/svg?seed=${workspace.id}`"
                      size="sm"
                    />

                    <span
                      :class="[
                        selected ? 'font-medium' : 'font-normal',
                        'block truncate',
                      ]"
                      >{{ workspace.title }}</span
                    >
                  </div>

                  <span
                    v-if="selected"
                    class="flex items-center text-amber-600"
                  >
                    <Icon name="ph:check-bold" class="h-5 w-5" />
                  </span>
                </li>
              </HeadlessListboxOption>

              <div class="mx-auto my-1 h-[1px] w-[90%] bg-slate-200"></div>

              <div @click="createNewWorkspace">
                <li
                  class="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-gray-900"
                >
                  <div class="flex items-center justify-start gap-2 pr-4">
                    <Icon name="ph:plus-circle-bold" />

                    <span class="block truncate font-medium">
                      Create a new workspace
                    </span>
                  </div>
                </li>
              </div>
            </HeadlessListboxOptions>
          </transition>
        </div>
      </HeadlessListbox>
    </div>

    <TransitionFade>
      <svg
        v-if="route.params.collectionid"
        fill="none"
        shape-rendering="geometricPrecision"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1"
        viewBox="0 0 24 24"
        width="14"
        height="14"
        class="h-8 w-8 text-gray-200"
      >
        <path d="M16.88 3.549L7.12 20.451"></path>
      </svg>
    </TransitionFade>

    <TransitionFade>
      <div v-if="route.params.collectionid" class="w-max">
        <HeadlessListbox v-model="selectedCollection">
          <div class="relative">
            <ContainerFlex align="center">
              <NuxtLink
                :to="`/dashboard/workspaces/${currentWorkspace?.id}/collections/${selectedCollection}`"
              >
                <TransitionFade>
                  <div
                    v-if="collectionStore.getLoading"
                    class="flex items-center justify-start gap-2"
                  >
                    <USkeleton class="h-[20px] w-[20px] rounded-full" />

                    <USkeleton class="h-[25px] w-[100px]" />
                  </div>

                  <div
                    v-else
                    class="flex items-center justify-start gap-2 rounded-md p-1 transition-all hover:bg-gray-50"
                  >
                    <UAvatar
                      :src="`${currentCollection?.imageUrl}?t=${currentCollection?.updated}`"
                      size="sm"
                    />

                    <span
                      class="max-w-40 truncate text-base font-medium transition-all hover:text-gray-600"
                    >
                      {{ currentCollection?.title }}
                    </span>
                  </div>
                </TransitionFade>
              </NuxtLink>

              <HeadlessListboxButton
                class="relative w-full cursor-pointer rounded-lg border border-slate-100 bg-white p-1 text-left transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm sm:text-sm"
              >
                <span
                  class="pointer-events-none inset-y-0 right-0 flex items-center"
                >
                  <Icon name="ph:caret-up-down-bold" class="h-5 w-5" />
                </span>
              </HeadlessListboxButton>
            </ContainerFlex>

            <transition
              leave-active-class="transition duration-100 ease-in"
              enter-active-class="transition duration-75 ease-out"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
              enter-from-class="opacity-0 transition transform origin-top-right scale-95"
              enter-to-class="opacity-100 transform origin-top-right scale-100"
            >
              <HeadlessListboxOptions
                class="absolute mt-1 max-h-60 w-max overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 sm:text-sm"
              >
                <HeadlessListboxOption
                  v-for="collection in allCollections"
                  v-slot="{ active, selected }"
                  :key="collection.id"
                  :value="collection.id"
                  as="template"
                  @click="navigateToCollection(collection.id)"
                >
                  <li
                    :class="[
                      active ? 'bg-amber-100 text-amber-900' : 'text-gray-900',
                      'flex w-full cursor-pointer items-center justify-between px-4 py-1',
                    ]"
                  >
                    <div class="flex items-center justify-start gap-2 pr-4">
                      <UAvatar
                        :src="`${collection?.imageUrl}?t=${collection?.updated}`"
                        size="sm"
                      />

                      <UTooltip
                        v-if="collection.title.length > 19"
                        :text="collection.title"
                      >
                        <span
                          :class="[
                            selected ? 'font-medium' : 'font-normal',
                            'block max-w-40 truncate',
                          ]"
                        >
                          {{ collection.title }}
                        </span>
                      </UTooltip>

                      <span
                        v-else
                        :class="[
                          selected ? 'font-medium' : 'font-normal',
                          'block max-w-40 truncate',
                        ]"
                      >
                        {{ collection.title }}
                      </span>
                    </div>

                    <span
                      v-if="selected"
                      class="flex items-center text-amber-600"
                    >
                      <Icon name="ph:check-bold" class="h-5 w-5" />
                    </span>
                  </li>
                </HeadlessListboxOption>

                <div class="mx-auto my-1 h-[1px] w-[90%] bg-slate-200"></div>

                <div @click="createNewCollection">
                  <li
                    class="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-gray-900"
                  >
                    <div class="flex items-center justify-start gap-2 pr-4">
                      <Icon name="ph:plus-circle-bold" />

                      <span class="block truncate font-medium">
                        Create a new collection
                      </span>
                    </div>
                  </li>
                </div>
              </HeadlessListboxOptions>
            </transition>
          </div>
        </HeadlessListbox>
      </div>
    </TransitionFade>

    <TransitionFade>
      <svg
        v-if="route.params.resourceid"
        fill="none"
        shape-rendering="geometricPrecision"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1"
        viewBox="0 0 24 24"
        width="14"
        height="14"
        class="h-8 w-8 text-gray-200"
      >
        <path d="M16.88 3.549L7.12 20.451"></path>
      </svg>
    </TransitionFade>

    <TransitionFade>
      <div v-if="route.params.resourceid" class="w-max">
        <HeadlessListbox v-model="selectedResource">
          <div class="relative">
            <ContainerFlex align="center">
              <NuxtLink
                :to="`/dashboard/workspaces/${currentWorkspace?.id}/collections/${selectedCollection}/resources/${selectedResource}`"
              >
                <TransitionFade>
                  <div
                    v-if="resourceStore.getLoading"
                    class="flex items-center justify-start gap-2"
                  >
                    <USkeleton class="h-[20px] w-[20px] rounded-full" />

                    <USkeleton class="h-[25px] w-[100px]" />
                  </div>

                  <div
                    v-else
                    class="flex items-center justify-start gap-2 rounded-md p-1 transition-all hover:bg-gray-50"
                  >
                    <UAvatar
                      :src="`https://api.dicebear.com/6.x/shapes/svg?seed=${selectedResource}`"
                      size="sm"
                    />

                    <span
                      v-if="currentResource?.title"
                      class="max-w-40 truncate text-base font-medium transition-all hover:text-gray-600"
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

              <HeadlessListboxButton
                class="relative w-full cursor-pointer rounded-lg border border-slate-100 bg-white p-1 text-left transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm sm:text-sm"
              >
                <span
                  class="pointer-events-none inset-y-0 right-0 flex items-center"
                >
                  <Icon name="ph:caret-up-down-bold" class="h-5 w-5" />
                </span>
              </HeadlessListboxButton>
            </ContainerFlex>

            <transition
              leave-active-class="transition duration-100 ease-in"
              enter-active-class="transition duration-75 ease-out"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
              enter-from-class="opacity-0 transition transform origin-top-right scale-95"
              enter-to-class="opacity-100 transform origin-top-right scale-100"
            >
              <HeadlessListboxOptions
                class="absolute mt-1 max-h-60 w-max overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 sm:text-sm"
              >
                <HeadlessListboxOption
                  v-for="resource in allResources"
                  v-slot="{ active, selected }"
                  :key="resource.id"
                  :value="resource.id"
                  as="template"
                  @click="navigateToResource(resource.id)"
                >
                  <li
                    :class="[
                      active ? 'bg-amber-100 text-amber-900' : 'text-gray-900',
                      'flex w-full cursor-pointer items-center justify-between px-4 py-1',
                    ]"
                  >
                    <div class="flex items-center justify-start gap-2 pr-4">
                      <UAvatar
                        :src="`https://api.dicebear.com/6.x/shapes/svg?seed=${resource.id}`"
                        size="sm"
                      />

                      <UTooltip
                        v-if="resource.title.length > 19"
                        :text="resource.title"
                      >
                        <span
                          :class="[
                            selected ? 'font-medium' : 'font-normal',
                            'block max-w-40 truncate',
                          ]"
                        >
                          {{ resource.title }}
                        </span>
                      </UTooltip>

                      <span
                        v-else
                        :class="[
                          selected ? 'font-medium' : 'font-normal',
                          'block max-w-40 truncate',
                        ]"
                      >
                        {{ resource.title }}
                      </span>
                    </div>

                    <span
                      v-if="selected"
                      class="flex items-center text-amber-600"
                    >
                      <Icon name="ph:check-bold" class="h-5 w-5" />
                    </span>
                  </li>
                </HeadlessListboxOption>
              </HeadlessListboxOptions>
            </transition>
          </div>
        </HeadlessListbox>
      </div>
    </TransitionFade>

    <ModalNewWorkspace />

    <ModalNewCollection v-if="route.params.collectionid" />
  </div>
</template>
