<script setup lang="ts">
import { Icon } from "#components";

definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const push = usePush();
const route = useRoute();

const collectionStore = useCollectionStore();

const { collectionid, resourceid, workspaceid } = route.params as {
  collectionid: string;
  resourceid: string;
  workspaceid: string;
};

const currentCollection = computed(() => {
  return (
    collectionStore.collection || {
      version: {
        published: false,
      },
    }
  );
});

const { data: resource, error } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}`,
  {
    headers: useRequestHeaders(["cookie"]),
  }
);

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your resource",
  });

  navigateTo(
    `/dashboard/workspaces/${workspaceid}/collections/${collectionid}`
  );
}

if (resource.value) {
  // If the resource is marked for deletion, redirect the user
  // to the collection page
  if (
    "action" in resource.value &&
    (resource.value.action === "delete" ||
      resource.value.action === "oldVersion")
  ) {
    push.error({
      title: "Resource marked for deletion",
      message: "You will need to undelete this resource before you can view it",
    });

    navigateTo(
      `/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources`
    );

    throw new Error("Resource marked for deletion");
  }
}

const { data: relations, pending: relationsPending } = useLazyFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations`,
  {
    headers: useRequestHeaders(["cookie"]),
  }
);
</script>

<template>
  <main class="h-full bg-white">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <n-space vertical>
          <h1>Relations</h1>

          <n-tag v-if="resource?.back_link_id" type="info" size="large">
            {{ resource?.back_link_id }}
          </n-tag>
        </n-space>

        <div class="flex items-center space-x-2">
          <NuxtLink
            v-if="!currentCollection?.version?.published"
            :to="`/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations/edit`"
          >
            <n-button size="large" color="black">
              <template #icon>
                <Icon name="material-symbols-light:rebase-edit-rounded" />
              </template>

              Update relations
            </n-button>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <div class="flex items-center justify-between space-x-4 pb-5 pt-10">
        <TransitionFade>
          <div v-if="relationsPending" class="flex w-full justify-center">
            <client-only>
              <Vue3Lottie
                animation-link="https://assets10.lottiefiles.com/packages/lf20_AQEOul.json"
                :height="200"
                :width="200"
              />
            </client-only>
          </div>

          <div v-else>
            <pre>{{ relations }}</pre>
          </div>
        </TransitionFade>
      </div>
    </div>

    <ModalNewCollection />
  </main>
</template>
