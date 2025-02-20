<script setup lang="ts">
import sanitizeHtml from "sanitize-html";
import { MdEditor, config } from "md-editor-v3";

import TargetBlankExtension from "@/utils/TargetBlankExtension";
import { UButton } from "#components";

config({
  markdownItConfig(md) {
    md.use(TargetBlankExtension);
  },
});

definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const toast = useToast();
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
  {},
);

if (error.value) {
  console.log(error.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    description: "We couldn't load your changelog",
    icon: "material-symbols:error",
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

      method: "PUT",
    },
  )
    .then((_res) => {
      saveLoading.value = false;

      toast.add({
        title: "Changelog saved",
        color: "success",
        description: "We've saved your changelog",
        icon: "material-symbols:check-bold",
      });
    })
    .catch((error) => {
      saveLoading.value = false;

      console.log(error);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't save your changelog",
        icon: "material-symbols:error",
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
          <h1 class="text-4xl font-black">Changelog</h1>
        </div>

        <div class="flex items-center space-x-2">
          <UButton
            v-if="!data?.version?.published"
            size="lg"
            color="primary"
            :loading="saveLoading"
            :disabled="disableChangelogFeature"
            icon="material-symbols:save"
            @click="saveChangelog"
          >
            Save changelog
          </UButton>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <div class="flex items-center justify-between space-x-4 pt-10 pb-5">
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
  </main>
</template>
