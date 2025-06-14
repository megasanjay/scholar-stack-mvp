<script setup lang="ts">
import calver from "calver";

definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const toast = useToast();
const route = useRoute();

const publishCollectionModalIsOpen = ref(false);
const publishCollectionLoading = ref(false);

const { collectionid, workspaceid } = route.params as {
  collectionid: string;
  workspaceid: string;
};

const { data: collection, error: collectionError } =
  await useFetch<CollectionGETAPIResponse>(
    `/api/workspaces/${workspaceid}/collections/${collectionid}`,
    {},
  );

if (collectionError.value) {
  console.log(collectionError.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    description: "We couldn't load your collectionss",
    icon: "material-symbols:error",
  });

  navigateTo(`/dashboard/workspaces/${workspaceid}`);
}

if (collection.value) {
  const version = collection.value.version;

  // if version is published or no version exists, redirect to overview
  if (!version || version.published) {
    navigateTo(
      `/dashboard/workspaces/${workspaceid}/collections/${collectionid}`,
    );
  }
}

const { collectionPermissionAbility, collectionPermissionGetLoading } =
  await useCollectionPermission(workspaceid, collectionid);

const {
  data: validationResults,
  error: _validationError,
  pending: validationPending,
} = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/validate`,
  {
    lazy: true,
    server: false,
  },
);

const openPublishCollectionModal = () => {
  publishCollectionModalIsOpen.value = true;
};

const publishCollection = async () => {
  publishCollectionLoading.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/publish`,
    {
      method: "POST",
    },
  )
    .then((_res) => {
      publishCollectionLoading.value = false;

      toast.add({
        title: "Collection published",
        color: "success",
        description: "Your collection has been published",
        icon: "material-symbols:check-circle-outline",
      });

      // navigate to collection overview using window.location.href
      // This will cause a full page reload, but it's the only way to
      // ensure that the page clears the stores and fetches the new data
      window.location.href = `/dashboard/workspaces/${workspaceid}/collections/${collectionid}`;
    })
    .catch((error) => {
      publishCollectionLoading.value = false;

      console.log(error);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't publish your collection",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      publishCollectionLoading.value = false;
    });
};
</script>

<template>
  <AppPageLayout>
    <template #header>
      <div class="flex w-full items-center justify-between gap-2">
        <h1 class="text-4xl font-black">Publish</h1>

        <UModal
          v-model="publishCollectionModalIsOpen"
          :prevent-close="publishCollectionLoading"
        >
          <UButton
            v-if="!collection?.version?.published"
            size="lg"
            color="primary"
            icon="entypo:publish"
            :loading="validationPending || publishCollectionLoading"
            :disabled="
              validationPending ||
              !validationResults?.valid ||
              collectionPermissionGetLoading ||
              !collectionPermissionAbility.includes('publish')
            "
            @click="openPublishCollectionModal"
          >
            Publish
          </UButton>

          <template #content>
            <UCard>
              <div class="sm:flex sm:items-start">
                <div class="size-[50px]">
                  <ClientOnly>
                    <Vue3Lottie
                      animation-link="https://cdn.lottiel.ink/assets/l7OR00APs2klZnMWu8G4t.json"
                      :height="50"
                      :width="50"
                      :loop="1"
                    />
                  </ClientOnly>
                </div>

                <div class="mt-2 text-center sm:ml-4 sm:text-left">
                  <h3 class="text-base leading-6 font-semibold text-gray-900">
                    Are you sure you want to publish this collection?
                  </h3>

                  <div class="mt-2">
                    <p class="text-sm text-gray-500">
                      This action is not reversible and will make the collection
                      public. If needed, you can always publish a newer version
                      but this version will always still be available to the
                      public.
                    </p>
                  </div>
                </div>
              </div>

              <template #footer>
                <div class="flex items-center justify-end gap-2">
                  <UButton
                    color="error"
                    variant="soft"
                    icon="material-symbols:cancel-outline"
                    @click="publishCollectionModalIsOpen = false"
                  >
                    Cancel
                  </UButton>

                  <UButton
                    color="primary"
                    :loading="publishCollectionLoading"
                    icon="entypo:publish"
                    @click="publishCollection"
                  >
                    Publish collection
                  </UButton>
                </div>
              </template>
            </UCard>
          </template>
        </UModal>
      </div>
    </template>

    <div>
      <UAlert
        color="warning"
        title="Warning!"
        icon="material-symbols:warning"
        variant="subtle"
      >
        <template #description>
          You are about to publish the collection
          <strong>{{ collection?.title }}</strong
          >. This will make the collection available to the public under the
          version
          <UBadge color="success" size="sm">
            {{ calver.inc("yyyy.ww.minor", "", "calendar.minor") }}
          </UBadge>
        </template>
      </UAlert>

      <div class="flex items-center justify-between gap-4 pt-10 pb-5">
        <h2 class="text-2xl font-bold">
          Let's validate everything before publishing
        </h2>
      </div>

      <TransitionFade>
        <div v-if="validationPending">
          <client-only>
            <Vue3Lottie
              animation-link="https://assets10.lottiefiles.com/packages/lf20_AQEOul.json"
              :height="100"
              :width="100"
            />
          </client-only>
        </div>

        <div v-else class="flex w-full gap-4">
          <div
            v-if="
              validationResults?.errors && validationResults.errors.length > 0
            "
            class="flex w-full flex-col gap-4"
          >
            <UAlert
              color="error"
              title="This collection has some issues that need to be resolved before
                publishing"
              icon="material-symbols:error"
              variant="subtle"
            >
              Please fix the following issues before publishing the collection.
            </UAlert>

            <ul>
              <li v-for="error of validationResults.errors" :key="error.id">
                <div>
                  <NuxtLink
                    :to="`/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources/${error.id}`"
                    class="mb-1 flex items-center gap-2 text-lg font-semibold transition-all hover:text-slate-500"
                  >
                    <Icon name="material-symbols:open-in-new" size="20" />
                    {{ error.title || error.id }}
                  </NuxtLink>

                  <ul>
                    <li
                      v-for="(issue, index) of 'issues' in error
                        ? error.issues
                        : [{ path: [''], message: error.message }]"
                      :key="index"
                      class="flex py-1 pl-6 text-base"
                    >
                      <Icon
                        name="codicon:error"
                        size="20"
                        class="mt-1 text-red-500"
                      />

                      <span class="pl-1 font-medium">
                        {{ issue.path[0].toString() }}
                      </span>
                      -
                      {{ issue.message }}
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>

          <div v-else class="flex items-center gap-2">
            <client-only>
              <Vue3Lottie
                animation-link="https://lottie.host/e10cc5b7-fa4b-4fc8-bcb3-7c93a9d144e6/XFLFmY7XTO.json"
                :height="75"
                :width="75"
              />
            </client-only>

            <p class="text-center text-lg font-medium">
              All details are provided. You can now publish the collection.
            </p>
          </div>
        </div>
      </TransitionFade>

      <USeparator class="my-5" />

      <div class="flex items-center justify-between gap-4 py-5">
        <h2 class="text-2xl font-bold">Changelog</h2>

        <NuxtLink
          :to="`/dashboard/workspaces/${workspaceid}/collections/${collectionid}/changelog`"
        >
          <UButton color="primary" icon="mdi:text-box-edit">
            Update changelog
          </UButton>
        </NuxtLink>
      </div>

      <MarkdownRender
        :content="collection?.version?.changelog || 'No changelog provided'"
        class="pb-10"
      />
    </div>
  </AppPageLayout>
</template>
