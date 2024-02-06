<script setup lang="ts">
import { useWorkspaceStore } from "@/stores/workspace";

const route = useRoute();

const workspaceStore = useWorkspaceStore();
const collectionStore = useCollectionStore();
const resourceStore = useResourceStore();

const selectedWorkspace = ref("");
const selectedCollection = ref("");
const selectedResource = ref("");

workspaceStore.fetchWorkspaces();

const personalWorkspace = computed(() => {
  return workspaceStore.workspaces.find((workspace) => workspace.personal);
});

const allOtherWorkspaces = computed(() => {
  return workspaceStore.workspaces.filter((workspace) => !workspace.personal);
});

const currentWorkspace = computed(() => {
  return workspaceStore.workspace;
});

const allCollections = computed(() => {
  return collectionStore.collections;
});

const currentCollection = computed(() => {
  return collectionStore.collection;
});

const allResources = computed(() => {
  return resourceStore.resources;
});

const currentResource = computed(() => {
  return resourceStore.resource;
});

// watch for route changes and update selected workspace
watchEffect(() => {
  const workspaceid = route.params.workspaceid;
  const collectionid = route.params.collectionid;
  const resourceid = route.params.resourceid;

  if (workspaceid) {
    selectedWorkspace.value = workspaceid as string;
    workspaceStore.getWorkspace(workspaceid as string);
  }

  if (collectionid) {
    selectedCollection.value = collectionid as string;
    collectionStore.getCollection(
      workspaceid as string,
      collectionid as string,
    );
  }

  if (resourceid) {
    selectedResource.value = resourceid as string;
    resourceStore.getResource(
      workspaceid as string,
      collectionid as string,
      resourceid as string,
    );
  }
});

const navigateToWorkspace = (workspaceid: string) => {
  navigateTo(`/dashboard/workspaces/${workspaceid}`);

  collectionStore.fetchCollections(workspaceid);
};

const createNewWorkspace = () => {
  workspaceStore.showNewWorkspaceModal();
};

const navigateToCollection = (collectionid: string) => {
  navigateTo(
    `/dashboard/workspaces/${selectedWorkspace.value}/collections/${collectionid}`,
  );

  resourceStore.fetchResources(selectedWorkspace.value, collectionid);
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
    <NuxtLink to="/dashboard" class=" ">
      <img src="/logo/logo.svg" alt="Logo" class="w-10" />
    </NuxtLink>

    <svg
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

    <div class="w-max">
      <HeadlessListbox v-model="selectedWorkspace">
        <div class="relative">
          <n-space align="center">
            <NuxtLink :to="`/dashboard/workspaces/${currentWorkspace?.id}`">
              <TransitionFade>
                <div
                  v-if="workspaceStore.getLoading"
                  class="flex items-center justify-start space-x-2"
                >
                  <n-skeleton circle :width="20" />

                  <n-skeleton
                    v-if="workspaceStore.getLoading"
                    :width="100"
                    height="25"
                  />
                </div>

                <div
                  v-else
                  class="flex items-center justify-start space-x-2 rounded-md p-1 transition-all hover:bg-gray-50"
                >
                  <n-avatar
                    :size="20"
                    :src="`https://api.dicebear.com/6.x/shapes/svg?seed=${currentWorkspace?.id}`"
                    class="border"
                    round
                  />

                  <span
                    class="text-base font-medium transition-all hover:text-gray-600"
                  >
                    {{ currentWorkspace?.title }}
                  </span>

                  <n-tag
                    v-if="currentWorkspace?.personal"
                    type="info"
                    round
                    size="small"
                    class="pointer-events-none"
                  >
                    Personal
                  </n-tag>
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
          </n-space>

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
                  <div class="flex items-center justify-start space-x-2 pr-4">
                    <n-avatar
                      :size="20"
                      :src="`https://api.dicebear.com/6.x/shapes/svg?seed=${personalWorkspace?.id}`"
                      class="border hover:cursor-pointer hover:opacity-80"
                      round
                    />

                    <span
                      :class="[
                        selected ? 'font-medium' : 'font-normal',
                        'block truncate',
                      ]"
                      >{{ personalWorkspace?.title }}</span
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
                  <div class="flex items-center justify-start space-x-2 pr-4">
                    <n-avatar
                      :size="20"
                      :src="`https://api.dicebear.com/6.x/shapes/svg?seed=${workspace.id}`"
                      class="border hover:cursor-pointer hover:opacity-80"
                      round
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
                  <div class="flex items-center justify-start space-x-2 pr-4">
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
            <n-space align="center">
              <NuxtLink
                :to="`/dashboard/workspaces/${currentWorkspace?.id}/collections/${selectedCollection}`"
              >
                <TransitionFade>
                  <div
                    v-if="collectionStore.getLoading"
                    class="flex items-center justify-start space-x-2"
                  >
                    <n-skeleton circle :width="20" />

                    <n-skeleton :width="100" height="25" />
                  </div>

                  <div
                    v-else
                    class="flex items-center justify-start space-x-2 rounded-md p-1 transition-all hover:bg-gray-50"
                  >
                    <n-avatar
                      :size="20"
                      :src="`https://api.dicebear.com/6.x/shapes/svg?seed=${selectedCollection}`"
                      class="border"
                      round
                    />

                    <span
                      class="text-base font-medium transition-all hover:text-gray-600"
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
            </n-space>

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
                      'flex w-full cursor-pointer items-center justify-between px-4 py-2',
                    ]"
                  >
                    <div class="flex items-center justify-start space-x-2 pr-4">
                      <n-avatar
                        :size="20"
                        :src="`https://api.dicebear.com/6.x/shapes/svg?seed=${collection.id}`"
                        class="border hover:cursor-pointer hover:opacity-80"
                        round
                      />

                      <span
                        :class="[
                          selected ? 'font-medium' : 'font-normal',
                          'block truncate',
                        ]"
                        >{{ collection.title }}</span
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

                <div @click="createNewCollection">
                  <li
                    class="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-gray-900"
                  >
                    <div class="flex items-center justify-start space-x-2 pr-4">
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
            <n-space align="center">
              <NuxtLink
                :to="`/dashboard/workspaces/${currentWorkspace?.id}/collections/${selectedCollection}/resources/${selectedResource}`"
              >
                <TransitionFade>
                  <div
                    v-if="resourceStore.getLoading"
                    class="flex items-center justify-start space-x-2"
                  >
                    <n-skeleton circle :width="20" />

                    <n-skeleton :width="100" height="25" />
                  </div>

                  <div
                    v-else
                    class="flex items-center justify-start space-x-2 rounded-md p-1 transition-all hover:bg-gray-50"
                  >
                    <n-avatar
                      :size="20"
                      :src="`https://api.dicebear.com/6.x/shapes/svg?seed=${selectedResource}`"
                      class="border"
                      round
                    />

                    <span
                      v-if="currentResource?.title"
                      class="max-w-40 truncate text-base font-medium transition-all hover:text-gray-600"
                    >
                      {{ currentResource?.title }}
                    </span>

                    <n-tag
                      v-else
                      type="success"
                      size="small"
                      class="pointer-events-none"
                    >
                      New
                    </n-tag>
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
            </n-space>

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
                      'flex w-full cursor-pointer items-center justify-between px-4 py-2',
                    ]"
                  >
                    <div class="flex items-center justify-start space-x-2 pr-4">
                      <n-avatar
                        :size="20"
                        :src="`https://api.dicebear.com/6.x/shapes/svg?seed=${resource.id}`"
                        class="border hover:cursor-pointer hover:opacity-80"
                        round
                      />

                      <span
                        :class="[
                          selected ? 'font-medium' : 'font-normal',
                          'block max-w-40 truncate',
                        ]"
                        >{{ resource.title }}</span
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
