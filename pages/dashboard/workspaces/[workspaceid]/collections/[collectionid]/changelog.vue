<script setup lang="ts">
import sanitizeHtml from "sanitize-html";
import { MdEditor, config } from "md-editor-v3";

import TargetBlankExtension from "@/utils/TargetBlankExtension";

config({
  markdownItConfig(md) {
    md.use(TargetBlankExtension);
  },
});

definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const route = useRoute();

const changelog = ref("");
const saveLoading = ref(false);

const sanitize = (html: string) => sanitizeHtml(html);

const { collectionid, workspaceid } = route.params as {
  collectionid: string;
  workspaceid: string;
};

const { data, error } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/version`,
  {
    headers: useRequestHeaders(["cookie"]),
  },
);

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your changelog.",
  });

  navigateTo(`/dashboard/workspaces/${workspaceid}`);
}

if (data.value) {
  const version = data.value.version;

  // if version is published or no version exists, redirect to overview
  if (version && !version.published) {
    changelog.value = version.changelog;
  } else {
    navigateTo(
      `/dashboard/workspaces/${workspaceid}/collections/${collectionid}`,
    );
  }
}

const { collectionPermissionAbility, collectionPermissionGetLoading } =
  await useCollectionPermission(workspaceid, collectionid);

const disableChangelogFeature = computed(() => {
  return (
    collectionPermissionGetLoading.value ||
    !collectionPermissionAbility.value.includes("edit")
  );
});

const saveChangelog = async () => {
  saveLoading.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/version/changelog`,
    {
      body: JSON.stringify({
        changelog: changelog.value,
      }),
      headers: useRequestHeaders(["cookie"]),
      method: "PUT",
    },
  )
    .then((_res) => {
      saveLoading.value = false;

      push.success({
        title: "Success",
        message: "We saved your changelog.",
      });
    })
    .catch((error) => {
      saveLoading.value = false;

      console.log(error);

      push.error({
        title: "Something went wrong",
        message: "We couldn't save your changelog.",
      });
    })
    .finally(() => {
      saveLoading.value = false;
    });
};
</script>

<template>
  <main class="h-full bg-white">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <div class="flex w-full items-center justify-between">
          <h1>Changelog</h1>
        </div>

        <div class="flex items-center space-x-2">
          <n-button
            v-if="!data?.version?.published"
            size="large"
            color="black"
            :loading="saveLoading"
            :disabled="disableChangelogFeature"
            @click="saveChangelog"
          >
            <template #icon>
              <Icon name="material-symbols:save" />
            </template>
            Save changelog
          </n-button>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <div class="flex items-center justify-between space-x-4 pb-5 pt-10">
        <MdEditor
          v-model="changelog"
          class="mt-0"
          language="en-US"
          preview-theme="github"
          :show-code-row-number="true"
          :disabled="disableChangelogFeature"
          :sanitize="sanitize"
        />
      </div>
    </div>

    <ModalNewCollection />
  </main>
</template>
