<script setup lang="ts">
import sanitizeHtml from "sanitize-html";
import { MdEditor, config } from "md-editor-v3";
import COLLECTION_TYPE_JSON from "@/assets/json/collection-type.json";

import TargetBlankExtension from "~/utils/TargetBlankExtension";

config({
  markdownItConfig(md) {
    md.use(TargetBlankExtension);
  },
});

const toast = useToast();

const collectionTypeOptions = COLLECTION_TYPE_JSON;

const files = ref();

const versionId = ref(0);
const collectionImage = ref("");
const collectionName = ref("");
const collectionDescription = ref("");
const collectionDetailedDescription = ref("");
const collectionType = ref("");
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
  {},
);

if (error.value) {
  console.log(error.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    description: "We couldn't load your collection details",
    icon: "material-symbols:error",
  });

  navigateTo("/dashboard");
}

if (collection.value) {
  collectionName.value = collection.value.title;
  collectionDescription.value = collection.value.description;
  collectionDetailedDescription.value = collection.value.detailedDescription;
  collectionImage.value = `${collection.value.imageUrl}?t=${collection.value.updated}`;
  collectionType.value = collection.value.type;

  versionId.value = collection.value.version?.id || 0;
}

const openDiscardVersionModal = () => {
  discardVersionModalIsOpen.value = true;
};

const discardDraftVersion = async () => {
  discardVersionLoading.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/version`,
    {
      method: "DELETE",
    },
  )
    .then((_res) => {
      discardVersionLoading.value = false;

      toast.add({
        title: "Success",
        color: "success",
        description: "We discarded the draft version",
        icon: "material-symbols:check-circle-outline",
      });

      // refresh the page
      window.location.reload();
    })
    .catch((error) => {
      discardVersionLoading.value = false;

      console.log(error);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't discard the draft version",
        icon: "material-symbols:error",
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
      method: "PUT",
    },
  )
    .then(() => {
      toast.add({
        title: "Success",
        color: "success",
        description: "Your collection has been hidden",
        icon: "material-symbols:check-circle-outline",
      });

      navigateTo(`/dashboard/workspaces/${workspaceid}`);
    })
    .catch((err) => {
      console.error(err);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't hide your collection",
        icon: "material-symbols:error",
      });
    });
};

const deleteCollection = async () => {
  await $fetch(`/api/workspaces/${workspaceid}/collections/${collectionid}`, {
    method: "DELETE",
  })
    .then(() => {
      toast.add({
        title: "Success",
        color: "success",
        description: "Your collection has been deleted",
        icon: "material-symbols:check-circle-outline",
      });

      navigateTo(`/dashboard/workspaces/${workspaceid}`);
    })

    .catch((err) => {
      console.log(err);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't delete your collection",
        icon: "material-symbols:error",
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
      type: collectionType.value,
    }),

    method: "PUT",
  })
    .then((_res) => {
      toast.add({
        title: "Success",
        color: "success",
        description:
          "Your collection details have been updated. Please wait for a few seconds to see the changes.",
        icon: "material-symbols:check-circle-outline",
      });

      window.location.reload();
    })
    .catch((err) => {
      console.log(err);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't update your collection details",
        icon: "material-symbols:error",
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
      toast.add({
        title: "Error",
        color: "error",
        description: "File size must be less than 2MB",
        icon: "material-symbols:error",
      });

      throw new Error("File size must be less than 2MB");
    }

    // Check if the file is an image
    if (!fileType.startsWith("image/")) {
      toast.add({
        title: "Error",
        color: "error",
        description: "You must select an image file",
        icon: "material-symbols:error",
      });

      throw new Error("You must select an image file");
    }

    const formData = new FormData();

    formData.append("image", file);

    await $fetch(
      `/api/workspaces/${workspaceid}/collections/${collectionid}/thumbnail`,
      {
        body: formData,

        method: "PUT",
      },
    )
      .then(() => {
        toast.add({
          title: "Success",
          color: "success",
          description: "Your collection thumbnail has been updated",
          icon: "material-symbols:check-circle-outline",
        });

        // const newFileName = `${fileName}.${fileExt}`;

        // collectionImage.value = `https://sciconnect-test.b-cdn.net/collection/${newFileName}?t=${Date.now()}`;

        window.location.reload();
      })
      .catch((error) => {
        console.error("Error uploading image: ", error.message);
        toast.add({
          title: "Error",
          color: "error",
          description: "Could not upload image. Please try again",
          icon: "material-symbols:error",
        });
      });
  } catch (error: any) {
    console.error("Error uploading image: ", error.message);

    toast.add({
      title: "Error",
      color: "error",
      description: "Something went wrong. Please try again.",
      icon: "material-symbols:error",
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

        <div class="relative">
          <label class="" for="single">
            <UAvatar
              :src="
                collectionImage ||
                'https://api.dicebear.com/6.x/shapes/svg?seed=collection'
              "
              size="xl"
              alt="Collection Thumbnail"
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

      <UInput
        v-model="collectionName"
        placeholder="Collection Name"
        class="w-full"
        size="lg"
      />

      <template #action>
        <div class="flex items-center justify-end">
          <UButton
            color="primary"
            icon="humbleicons:save"
            size="lg"
            :loading="saveLoading"
            :disabled="collectionName.trim() === ''"
            @click="updateCollectionDetails"
          >
            Save
          </UButton>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Description">
      <p class="my-3 text-sm">
        This is a short description of your collection. If a detailed
        description is not needed, you can use this field to describe your
        collection.
      </p>

      <UTextarea
        v-model="collectionDescription"
        placeholder="Collection Description"
        class="w-full"
        size="lg"
        :rows="4"
      />

      <template #action>
        <div class="flex items-center justify-end">
          <UButton
            color="primary"
            icon="humbleicons:save"
            size="lg"
            :loading="saveLoading"
            :disabled="collectionDescription.trim() === ''"
            @click="updateCollectionDetails"
          >
            Save
          </UButton>
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
          <UButton
            color="primary"
            icon="humbleicons:save"
            size="lg"
            :loading="saveLoading"
            :disabled="collectionDetailedDescription.trim() === ''"
            @click="updateCollectionDetails"
          >
            Save
          </UButton>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Collection Type">
      <p class="my-3 text-sm">
        You can select the type of collection here. Selecting the appropriate
        type will help users understand the purpose of your collection.
      </p>

      <USelect
        v-model="collectionType"
        :items="collectionTypeOptions"
        placeholder="Select a collection type"
        class="w-full"
        size="lg"
      />

      <template #action>
        <div class="flex items-center justify-end">
          <UButton
            color="primary"
            icon="humbleicons:save"
            size="lg"
            :loading="saveLoading"
            @click="updateCollectionDetails"
          >
            Save
          </UButton>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Collection ID">
      <p class="my-3 text-sm">
        This is your collection's unique ID within the platform.
      </p>

      <UInput
        v-model="collectionid"
        disabled
        size="lg"
        icon="mdi:content-copy"
      />

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

      <UInput v-model="versionId" disabled size="lg" icon="mdi:content-copy" />

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
          <UModal v-model="discardVersionModalIsOpen">
            <UButton
              color="warning"
              icon="bx:reset"
              @click="openDiscardVersionModal"
            >
              Reset collection
            </UButton>

            <template #content>
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
                    <h3 class="text-base leading-6 font-semibold text-gray-900">
                      Are you sure you want to reset this collection?
                    </h3>

                    <div class="mt-2">
                      <p class="text-sm text-gray-500">
                        This will discard any changes you have made. This action
                        is not reversible, so please continue with caution.
                      </p>
                    </div>
                  </div>
                </div>

                <template #footer>
                  <div class="flex items-center justify-end space-x-2">
                    <UButton
                      icon="material-symbols:cancel-outline"
                      color="error"
                      variant="soft"
                      @click="discardVersionModalIsOpen = false"
                    >
                      Cancel
                    </UButton>

                    <UButton
                      color="warning"
                      icon="bx:reset"
                      :loading="discardVersionLoading"
                      @click="discardDraftVersion"
                    >
                      Reset collection
                    </UButton>
                  </div>
                </template>
              </UCard>
            </template>
          </UModal>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Hide collection">
      <p class="my-3 text-sm">
        Collections cannot be deleted after they have been created. However, you
        may hide this collection from your dashboard. This action is reversible.
      </p>

      <template #action>
        <div class="flex items-center justify-end">
          <UButton color="error" icon="mdi:hide" @click="hideCollection">
            Hide
          </UButton>
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
          <UButton color="error" icon="mdi:delete" @click="deleteCollection">
            Delete
          </UButton>
        </div>
      </template>
    </CardWithAction>
  </div>
</template>
