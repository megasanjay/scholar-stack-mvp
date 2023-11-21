<script setup lang="ts">
import sanitizeHtml from "sanitize-html";
import { parse } from "marked";
import calver from "calver";

definePageMeta({
  layout: "collections-layout",
  middleware: ["auth"],
});

const push = usePush();
const route = useRoute();

const { collectionid, workspaceid } = route.params as {
  collectionid: string;
  workspaceid: string;
};

const { data: collection, error: collectionError } =
  await useFetch<CollectionGETAPIResponse>(
    `/api/workspaces/${workspaceid}/collections/${collectionid}`,
    {
      headers: useRequestHeaders(["cookie"]),
    }
  );

if (collectionError.value) {
  console.log(collectionError.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your collectionss",
  });

  navigateTo(`/dashboard/workspaces/${workspaceid}`);
}

const { data: validationResults, pending: validationPending } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/validate`,
  {
    headers: useRequestHeaders(["cookie"]),
    lazy: true,
    server: false,
  }
);

const sanitize = (html: string) => sanitizeHtml(html);

const markdownToHtml = computed(() => {
  return sanitize(
    parse(collection.value?.version?.changelog || "No changelog")
  );
});

const publishCollection = async () => {
  const { data, error } = await useFetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/publish`,
    {
      headers: useRequestHeaders(["cookie"]),
      method: "POST",
    }
  );

  if (error.value) {
    console.log(error.value);

    push.error({
      title: "Something went wrong",
      message: "We couldn't publish your collection",
    });

    return;
  }

  if (data.value) {
    push.success({
      title: "Collection published",
      message: "Your collection has been published",
    });

    navigateTo(
      `/dashboard/workspaces/${workspaceid}/collections/${collectionid}`
    );
  }
};
</script>

<template>
  <main class="bg-white">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <div class="flex w-full items-center justify-between">
          <n-space align="center">
            <h1>Publish</h1>

            <n-tag>
              v.{{ calver.inc("yyyy.ww.minor", "", "calendar.minor") }}
            </n-tag>
          </n-space>

          <n-space align="center">
            <n-button
              v-if="!collection?.version?.published"
              size="large"
              color="black"
              :loading="validationPending"
              :disabled="validationPending || !validationResults?.valid"
              @click="publishCollection"
            >
              <template #icon>
                <Icon name="solar:star-bold" />
              </template>
              Publish collection
            </n-button>
          </n-space>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <div class="flex items-center justify-between space-x-4 pb-5 pt-10">
        <n-space align="center">
          <h3>Validation</h3>

          <n-tag :type="validationResults?.valid ? 'success' : 'error'">{{
            validationResults?.valid ? "Valid" : "Invalid"
          }}</n-tag>
        </n-space>
      </div>

      <transition name="fade" mode="out-in">
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
          <n-list v-if="validationResults?.errors">
            <n-list-item
              v-for="error of validationResults.errors"
              :key="error.id"
            >
              <n-space vertical>
                <NuxtLink
                  :to="`/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources/${error.id}`"
                >
                  {{ error.title || error.id }}
                </NuxtLink>

                <n-collapse>
                  <n-collapse-item
                    v-for="(issue, index) of error.issues"
                    :key="index"
                    :title="issue.path[0].toString()"
                    :name="index"
                  >
                    {{ issue.message }}
                  </n-collapse-item>
                </n-collapse>
              </n-space>
            </n-list-item>
          </n-list>

          <n-tag :type="validationResults?.valid ? 'success' : 'error'">{{
            validationResults?.valid ? "Valid" : "Invalid"
          }}</n-tag>
        </n-space>
      </transition>

      <n-divider />

      <div class="flex items-center justify-between space-x-4 pb-5 pt-10">
        <n-space align="center">
          <h3>Changelog</h3>

          <n-tag v-if="collection?.version?.published === false" type="warning">
            draft
          </n-tag>
        </n-space>

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

      <!-- eslint-disable vue/no-v-html -->
      <div
        class="prose mt-10 min-h-[300px] max-w-none"
        v-html="markdownToHtml"
      />
      <!-- eslint-enable vue/no-v-html -->
    </div>

    <ModalNewCollection />
  </main>
</template>