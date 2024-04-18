<script setup lang="ts">
import sanitizeHtml from "sanitize-html";
import { MdEditor, config } from "md-editor-v3";

import TargetBlankExtension from "@/utils/TargetBlankExtension";

config({
  markdownItConfig(md) {
    md.use(TargetBlankExtension);
  },
});

const files = ref();

const versionId = ref("");
const collectionImage = ref("");
const collectionName = ref("");
const collectionDescription = ref("");
const collectionDetailedDescription = ref("");
const discardVersionModalIsOpen = ref(false);

const discardVersionLoading = ref(false);
const thumbnailLoading = ref(false);
const saveLoading = ref(false);

const sanitize = (html: string) => sanitizeHtml(html);

const { collectionid, workspaceid } = useRoute().params as {
  collectionid: string;
  workspaceid: string;
};

const { data: collection, error } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}`,
  {
    headers: useRequestHeaders(["cookie"]),
  },
);

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your workspace details",
  });

  navigateTo("/dashboard");
}

if (collection.value) {
  collectionName.value = collection.value.title;
  collectionDescription.value = collection.value.description;
  collectionDetailedDescription.value = collection.value.detailedDescription;
  collectionImage.value = `${collection.value.image_url}?t=${Date.now()}`;

  versionId.value = collection.value.version?.id || "N/A";
}

const openDiscardVersionModal = () => {
  discardVersionModalIsOpen.value = true;
};

const discardDraftVersion = async () => {
  discardVersionLoading.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/version`,
    {
      headers: useRequestHeaders(["cookie"]),
      method: "DELETE",
    },
  )
    .then((_res) => {
      discardVersionLoading.value = false;

      push.success({
        title: "Success",
        message: "We discarded the draft version",
      });

      // refresh the page
      window.location.reload();
    })
    .catch((error) => {
      discardVersionLoading.value = false;

      console.log(error);

      push.error({
        title: "Something went wrong",
        message: "We couldn't discard the draft version",
      });
    })
    .finally(() => {
      discardVersionLoading.value = false;
    });
};

const hideCollection = async () => {
  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/hide`,
    {
      headers: useRequestHeaders(["cookie"]),
      method: "PUT",
    },
  )
    .then((_res) => {
      push.success({
        title: "Success",
        message: "Your collection has been hidden",
      });

      navigateTo(`/dashboard/workspaces/${workspaceid}`);
    })
    .catch((err) => {
      console.error(err);

      push.error({
        title: "Something went wrong",
        message: "We couldn't hide your collection",
      });
    });
};

const deleteCollection = async () => {
  await $fetch(`/api/workspaces/${workspaceid}/collections/${collectionid}`, {
    headers: useRequestHeaders(["cookie"]),
    method: "DELETE",
  })
    .then((_res) => {
      push.success({
        title: "Success",
        message: "Your collection has been deleted",
      });

      navigateTo(`/dashboard/workspaces/${workspaceid}`);
    })
    .catch((err) => {
      console.log(err);

      push.error({
        title: "Something went wrong",
        message: "We couldn't delete your collection",
      });
    });
};

const updateCollectionDetails = async () => {
  saveLoading.value = true;

  await $fetch(`/api/workspaces/${workspaceid}/collections/${collectionid}`, {
    body: JSON.stringify({
      title: collectionName.value.trim(),
      description: collectionDescription.value.trim(),
      detailedDescription: collectionDetailedDescription.value.trim(),
    }),
    headers: useRequestHeaders(["cookie"]),
    method: "PUT",
  })
    .then((_res) => {
      push.success({
        title: "Success",
        message:
          "Your collection details have been updated. Please wait for a few seconds to see the changes.",
      });

      window.location.reload();
    })
    .catch((err) => {
      console.log(err);

      push.error({
        title: "Something went wrong",
        message: "We couldn't update your collection details",
      });
    })
    .finally(() => {
      saveLoading.value = false;
    });
};

const updateThumbnail = async (evt: any) => {
  files.value = evt.target.files;

  try {
    thumbnailLoading.value = true;

    if (!files.value || files.value.length === 0) {
      throw new Error("You must select an image to upload.");
    }

    const file = files.value[0];
    // const fileName = collectionid;
    // const fileExt = file.name.split(".").pop();
    const fileSize = file.size;
    const fileType = file.type;

    // Limit file size to 2MB
    if (fileSize > 2 * 1024 * 1024) {
      push.error({
        title: "Error",
        message: "File size must be less than 2MB",
      });

      throw new Error("File size must be less than 2MB");
    }

    // Check if the file is an image
    if (!fileType.startsWith("image/")) {
      push.error({
        title: "Error",
        message: "You must select an image file",
      });

      throw new Error("You must select an image file");
    }

    const formData = new FormData();

    formData.append("image", file);

    await $fetch(
      `/api/workspaces/${workspaceid}/collections/${collectionid}/thumbnail`,
      {
        body: formData,
        headers: useRequestHeaders(["cookie"]),
        method: "PUT",
      },
    )
      .then(() => {
        push.success({
          title: "Success",
          message: "Your collection thumbnail has been updated",
        });

        // const newFileName = `${fileName}.${fileExt}`;

        // collectionImage.value = `https://sciconnect-test.b-cdn.net/collection/${newFileName}?t=${Date.now()}`;

        window.location.reload();
      })
      .catch((error) => {
        console.error("Error uploading image: ", error.message);
        push.error({
          title: "Error",
          message: "Could not upload image. Please try again",
        });
      });
  } catch (error) {
    push.error({
      title: "Error",
      message: "Something went wrong. Please try again.",
    });
  } finally {
    thumbnailLoading.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col space-y-4">
    <CardWithAction title="Thumbnail">
      <div class="flex items-start justify-between">
        <p class="my-3 text-sm">
          This is the thumbnail of your collection.
          <br />
          Click on the thumbnail to upload a custom one from your device.
        </p>

        <n-spin :show="thumbnailLoading">
          <div class="relative">
            <label class="" for="single">
              <n-avatar
                :src="collectionImage"
                :size="100"
                alt="Collection Thumbnail"
                class="cursor-pointer transition-all hover:opacity-70"
              />
            </label>

            <input
              id="single"
              style="position: absolute; visibility: hidden"
              type="file"
              accept="image/*"
              class="absolute inset-0 hidden"
              :disabled="thumbnailLoading"
              @change="updateThumbnail"
            />
          </div>
        </n-spin>
      </div>

      <template #action>
        <div class="flex h-full items-center justify-between">
          <p class="text-sm text-slate-600">
            A thumbnail is optional but strongly recommended.
          </p>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Title">
      <p class="my-3 text-sm">
        This is the title of your collection. The title used here is what will
        be shown in the public catalog page.
      </p>

      <n-input
        v-model:value="collectionName"
        placeholder="Collection Name"
        class="w-full"
        size="large"
      />

      <template #action>
        <div class="flex items-center justify-end">
          <n-button
            type="primary"
            color="black"
            :loading="saveLoading"
            :disabled="collectionName.trim() === ''"
            @click="updateCollectionDetails"
          >
            <template #icon>
              <Icon name="ic:round-save" />
            </template>
            Save
          </n-button>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Description">
      <p class="my-3 text-sm">
        This is a short description of your collection. If a detailed
        description is not needed, you can use this field to describe your
        collection.
      </p>

      <n-input
        v-model:value="collectionDescription"
        placeholder="Collection Description"
        class="w-full"
        type="textarea"
        size="large"
        show-count
        :maxlength="350"
      />

      <template #action>
        <div class="flex items-center justify-end">
          <n-button
            type="primary"
            color="black"
            :loading="saveLoading"
            :disabled="collectionDescription.trim() === ''"
            @click="updateCollectionDetails"
          >
            <template #icon>
              <Icon name="ic:round-save" />
            </template>
            Save
          </n-button>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Detailed Description">
      <p class="my-3 text-sm">
        If you need to provide a detailed description of your collection, you
        can use this field. This description will be shown instead of the short
        description in the public catalog page.
      </p>

      <MdEditor
        v-model="collectionDetailedDescription"
        class="mt-0 w-full max-w-screen-md"
        language="en-US"
        preview-theme="github"
        :show-code-row-number="true"
        :sanitize="sanitize"
        :max-length="5000"
      />

      <template #action>
        <div class="flex items-center justify-end">
          <n-button
            type="primary"
            color="black"
            :loading="saveLoading"
            :disabled="collectionDetailedDescription.trim() === ''"
            @click="updateCollectionDetails"
          >
            <template #icon>
              <Icon name="ic:round-save" />
            </template>
            Save
          </n-button>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Collection ID">
      <p class="my-3 text-sm">
        This is your collection's unique ID within the platform.
      </p>

      <n-input-group>
        <n-input
          v-model:value="collectionid"
          size="large"
          :style="{ width: '50%' }"
          disabled
        />

        <n-button type="info" secondary size="large">
          <template #icon>
            <Icon name="ic:round-content-copy" />
          </template>
        </n-button>
      </n-input-group>

      <template #action>
        <div class="flex h-full items-center justify-start">
          <p class="my-auto text-sm text-slate-600">
            This ID is unique and cannot be changed.
          </p>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Version ID">
      <p class="my-3 text-sm">
        This is your collection's version ID within the platform.
      </p>

      <n-input-group>
        <n-input
          v-model:value="versionId"
          size="large"
          :style="{ width: '50%' }"
          disabled
        />

        <n-button type="info" secondary size="large">
          <template #icon>
            <Icon name="ic:round-content-copy" />
          </template>
        </n-button>
      </n-input-group>

      <template #action>
        <div class="flex h-full items-center justify-start">
          <p class="my-auto text-sm text-slate-600">
            This ID is unique and cannot be changed.
          </p>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Reset collection to last published version">
      <p class="my-3 text-sm">
        Reset your collection to the last published version. This will discard
        any draft changes you have made. This action is not reversible, so
        please continue with caution.
      </p>

      <template #action>
        <div class="flex items-center justify-end">
          <n-button type="warning" @click="openDiscardVersionModal">
            <template #icon>
              <Icon name="bx:reset" />
            </template>
            Reset collection
          </n-button>
        </div>
      </template>
    </CardWithAction>

    <UModal
      v-model="discardVersionModalIsOpen"
      :prevent-close="discardVersionLoading"
    >
      <UCard>
        <div class="sm:flex sm:items-start">
          <div class="size-[50px]">
            <ClientOnly>
              <Vue3Lottie
                animation-link="https://cdn.lottiel.ink/assets/D_t3nuMGrtwzjOGX2UXXI.json"
                :height="50"
                :width="50"
                :loop="1"
              />
            </ClientOnly>
          </div>

          <div class="mt-2 text-center sm:ml-4 sm:text-left">
            <h3 class="text-base font-semibold leading-6 text-gray-900">
              Are you sure you want to reset this collection?
            </h3>

            <div class="mt-2">
              <p class="text-sm text-gray-500">
                This will discard any changes you have made. This action is not
                reversible, so please continue with caution.
              </p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-end space-x-2">
            <n-button @click="discardVersionModalIsOpen = false">
              <template #icon>
                <Icon name="material-symbols:cancel-outline" />
              </template>
              Cancel
            </n-button>

            <n-button
              type="warning"
              secondary
              :loading="discardVersionLoading"
              @click="discardDraftVersion"
            >
              <template #icon>
                <Icon name="bx:reset" />
              </template>
              Reset collection
            </n-button>
          </div>
        </template>
      </UCard>
    </UModal>

    <CardWithAction title="Hide collection">
      <p class="my-3 text-sm">
        Collections cannot be deleted after they have been created. However, you
        may hide this collection from your dashboard. This action is reversible.
      </p>

      <template #action>
        <div class="flex items-center justify-end">
          <n-button type="error" @click="hideCollection">
            <template #icon>
              <Icon name="mdi:hide" />
            </template>
            Hide
          </n-button>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Delete collection">
      <p class="my-3 text-sm">
        Permanently remove your collection and all of its contents from the
        platform. This action is not reversible, so please continue with
        caution.
      </p>

      <template #action>
        <div class="flex items-center justify-end">
          <n-button type="error" @click="deleteCollection">
            <template #icon>
              <Icon name="ic:round-delete" />
            </template>
            Delete
          </n-button>
        </div>
      </template>
    </CardWithAction>
  </div>
</template>
