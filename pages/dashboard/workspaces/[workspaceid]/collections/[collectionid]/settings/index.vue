<script setup lang="ts">
const collectionName = ref("");
const collectionDescription = ref("");
const discardVersionModalIsOpen = ref(false);

const discardVersionLoading = ref(false);
const saveLoading = ref(false);

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
</script>

<template>
  <div class="flex flex-col space-y-4">
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
        This is the description of your collection. You can change it to
        anything you want.
      </p>

      <n-input
        v-model:value="collectionDescription"
        placeholder="Collection Description"
        class="w-full"
        type="textarea"
        size="large"
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

    <CardWithAction title="Delete collection">
      <p class="my-3 text-sm">
        Permanently remove your collection and all of its contents from the
        platform. This action is not reversible, so please continue with
        caution.
      </p>

      <template #action>
        <div class="flex items-center justify-end">
          <n-button type="error" @click="deleteCollection"> Delete </n-button>
        </div>
      </template>
    </CardWithAction>
  </div>
</template>
