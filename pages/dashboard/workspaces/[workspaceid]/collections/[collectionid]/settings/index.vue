<script setup lang="ts">
const modalIsOpen = ref(false);

const collectionName = ref("");
const collectionDescription = ref("");

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

const closeModal = () => {
  modalIsOpen.value = false;
};

const openModal = () => {
  modalIsOpen.value = true;
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
    });
};
</script>

<template>
  <div class="flex flex-col space-y-4">
    <CardWithAction title="Collection Name">
      <p class="my-3 text-sm">
        This is the name of your collection. You can change it to anything you
        want.
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
            :disabled="collectionName.trim() === ''"
            @click="updateCollectionDetails"
          >
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
            :disabled="collectionDescription.trim() === ''"
            @click="updateCollectionDetails"
          >
            Save
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
          <n-button type="error" @click="deleteCollection"> Delete </n-button>
        </div>
      </template>
    </CardWithAction>

    <HeadlessTransitionRoot appear :show="modalIsOpen" as="template">
      <HeadlessDialog as="div" class="relative z-10" @close="closeModal">
        <HeadlessTransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="bg-opacity-25 fixed inset-0 bg-white/80" />
        </HeadlessTransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div
            class="flex min-h-full items-center justify-center p-4 text-center"
          >
            <HeadlessTransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <HeadlessDialogPanel
                class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
              >
                <HeadlessDialogTitle
                  as="h3"
                  class="text-lg font-medium leading-6 text-slate-900"
                >
                  Payment successful
                </HeadlessDialogTitle>

                <div class="mt-2">
                  <p class="text-sm text-slate-500">
                    Your payment has been successfully submitted. We’ve sent you
                    an email with all of the details of your order.
                  </p>
                </div>

                <div class="mt-4">
                  <button
                    type="button"
                    class="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    @click="closeModal"
                  >
                    Got it, thanks!
                  </button>
                </div>
              </HeadlessDialogPanel>
            </HeadlessTransitionChild>
          </div>
        </div>
      </HeadlessDialog>
    </HeadlessTransitionRoot>
  </div>
</template>
