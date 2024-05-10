<script setup lang="ts">
import calver from "calver";

definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

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
    {
      headers: useRequestHeaders(["cookie"]),
    },
  );

if (collectionError.value) {
  console.log(collectionError.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your collectionss",
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
    headers: useRequestHeaders(["cookie"]),
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
      headers: useRequestHeaders(["cookie"]),
      method: "POST",
    },
  )
    .then((_res) => {
      publishCollectionLoading.value = false;

      push.success({
        title: "Collection published",
        message: "Your collection has been published",
      });

      // navigate to collection overview using window.location.href
      // This will cause a full page reload, but it's the only way to
      // ensure that the page clears the stores and fetches the new data
      window.location.href = `/dashboard/workspaces/${workspaceid}/collections/${collectionid}`;
    })
    .catch((error) => {
      publishCollectionLoading.value = false;

      console.log(error);

      push.error({
        title: "Something went wrong",
        message: "We couldn't publish your collection",
      });
    })
    .finally(() => {
      publishCollectionLoading.value = false;
    });
};
</script>

<template>
  <main class="bg-white">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <div class="flex w-full items-center justify-between">
          <h1 class="mb-2">Publish</h1>

          <n-space align="center">
            <n-button
              v-if="!collection?.version?.published"
              size="large"
              color="black"
              :loading="validationPending || publishCollectionLoading"
              :disabled="
                validationPending ||
                !validationResults?.valid ||
                collectionPermissionGetLoading ||
                collectionPermissionAbility.includes('publish')
              "
              @click="openPublishCollectionModal"
            >
              <template #icon>
                <Icon name="entypo:publish" />
              </template>

              Publish
            </n-button>
          </n-space>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 pt-10 lg:px-20">
      <n-alert type="warning" title="Warning!">
        You are about to publish the collection
        <strong>{{ collection?.title }}</strong
        >.

        <br />

        This will make the collection available to the public under the version
        <n-tag type="success" size="small">
          {{ calver.inc("yyyy.ww.minor", "", "calendar.minor") }}
        </n-tag>
      </n-alert>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <div class="flex items-center justify-between space-x-4 pb-5 pt-10">
        <n-space align="center">
          <h3>Let's see if all details are provided</h3>
        </n-space>
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

        <n-space v-else vertical>
          <n-flex
            v-if="
              validationResults?.errors && validationResults.errors.length > 0
            "
            vertical
          >
            <n-alert
              type="error"
              title="This collection has some issues that need to be resolved before
                publishing."
            >
              Please fix the following issues before publishing the collection.
            </n-alert>

            <n-list>
              <n-list-item
                v-for="error of validationResults.errors"
                :key="error.id"
              >
                <div>
                  <NuxtLink
                    :to="`/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources/${error.id}`"
                    class="mb-1 text-lg font-semibold transition-all hover:text-slate-500"
                  >
                    {{ error.title || error.id }}
                  </NuxtLink>

                  <ul>
                    <li
                      v-for="(issue, index) of error.issues"
                      :key="index"
                      class="py-1 pl-2 text-base"
                    >
                      <Icon name="codicon:error" size="16" color="red" />

                      <span class="pl-1 font-medium">
                        {{ issue.path[0].toString() }}
                      </span>
                      -
                      {{ issue.message }}
                    </li>
                  </ul>
                </div>
              </n-list-item>
            </n-list>
          </n-flex>

          <n-flex v-else>
            <Icon name="mdi:check-circle" size="24" color="green" />

            <p>All details are provided. You can now publish the collection.</p>
          </n-flex>
        </n-space>
      </TransitionFade>

      <n-divider />

      <div class="flex items-center justify-between space-x-4 py-5">
        <h3>Changelog</h3>

        <NuxtLink
          :to="`/dashboard/workspaces/${workspaceid}/collections/${collectionid}/changelog`"
        >
          <n-button color="black">
            <template #icon>
              <Icon name="mdi:text-box-edit" />
            </template>

            Update changelog
          </n-button>
        </NuxtLink>
      </div>

      <MarkdownRender
        :content="collection?.version?.changelog || 'No changelog provided'"
        class="pb-10"
      />
    </div>

    <ModalNewCollection />

    <UModal
      v-model="publishCollectionModalIsOpen"
      :prevent-close="publishCollectionLoading"
    >
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
            <h3 class="text-base font-semibold leading-6 text-gray-900">
              Are you sure you want to publish this collection?
            </h3>

            <div class="mt-2">
              <p class="text-sm text-gray-500">
                This action is not reversible and will make the collection
                public. If needed, you can always publish a newer version but
                this version will always still be available to the public.
              </p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-end space-x-2">
            <n-button
              type="error"
              secondary
              @click="publishCollectionModalIsOpen = false"
            >
              <template #icon>
                <Icon name="material-symbols:cancel-outline" />
              </template>
              Cancel
            </n-button>

            <n-button
              color="black"
              :loading="publishCollectionLoading"
              @click="publishCollection"
            >
              <template #icon>
                <Icon name="entypo:publish" />
              </template>
              Publish collection
            </n-button>
          </div>
        </template>
      </UCard>
    </UModal>
  </main>
</template>
