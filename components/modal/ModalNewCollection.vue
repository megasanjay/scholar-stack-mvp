<script setup lang="ts">
import type { FormInst } from "naive-ui";
import { faker } from "@faker-js/faker";

import { useCollectionStore } from "@/stores/collection";

const route = useRoute();

const collectionStore = useCollectionStore();

const { workspaceid } = route.params as { workspaceid: string };

const formRef = ref<FormInst | null>(null);
const loading = ref(false);

const formValue = reactive({
  name: faker.commerce.product(),
  description: faker.lorem.paragraph(),
});

const rules = {
  name: {
    message: "Name is required",
    required: true,
    trigger: ["input", "blur"],
  },
};

const createCollection = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      loading.value = true;

      // Create a new collection
      await $fetch(`/api/workspaces/${workspaceid}/collections`, {
        body: JSON.stringify({
          title: formValue.name.trim(),
          description: formValue.description.trim(),
        }),
        headers: useRequestHeaders(["cookie"]),
        method: "POST",
      })
        .then((res) => {
          loading.value = false;

          if (res.statusCode === 201) {
            collectionStore.hideNewCollectionModal();

            push.success({
              title: "Collection created",
            });

            navigateTo(
              `/dashboard/workspaces/${workspaceid}/collections/${res.collectionId}`,
            );
          } else {
            console.error(res);
          }
        })
        .catch((err) => {
          loading.value = false;

          push.error({
            title: "Something went wrong",
          });

          console.error(err);
        })
        .finally(() => {
          loading.value = false;
        });
    } else {
      console.log(errors);
      push.error({
        title: "Something went wrong",
      });
    }
  });
};
</script>

<template>
  <HeadlessTransitionRoot
    appear
    :show="collectionStore.newCollectionModalIsOpen"
    as="template"
  >
    <HeadlessDialog
      as="div"
      class="relative z-10"
      @close="collectionStore.hideNewCollectionModal"
    >
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
              class="w-full max-w-lg transform overflow-hidden rounded-2xl border border-slate-200 bg-white text-left align-middle shadow-xl transition-all"
            >
              <HeadlessDialogTitle
                as="h3"
                class="px-8 pb-5 pt-8 text-2xl font-bold text-slate-900"
              >
                Create a new collection
              </HeadlessDialogTitle>

              <HeadlessDialogDescription class="mt-2 px-8 py-3">
                <n-form
                  ref="formRef"
                  :label-width="80"
                  :model="formValue"
                  size="large"
                  :rules="rules"
                >
                  <n-form-item label="Name" path="name">
                    <n-input
                      v-model:value="formValue.name"
                      placeholder="My awesome collection"
                    />
                  </n-form-item>

                  <n-form-item label="Description" path="description">
                    <n-input
                      v-model:value="formValue.description"
                      placeholder="This is my awesome collection!"
                      type="textarea"
                    />
                  </n-form-item>
                </n-form>
              </HeadlessDialogDescription>

              <div
                class="mt-4 flex items-center justify-end space-x-3 bg-slate-50 px-6 py-4"
              >
                <button
                  type="button"
                  class="inline-flex h-[40px] items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-black transition-all hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  @click="collectionStore.hideNewCollectionModal"
                >
                  Cancel
                </button>

                <n-button
                  color="black"
                  size="large"
                  :loading="loading"
                  @click="createCollection"
                >
                  <template #icon>
                    <Icon name="mdi:plus" />
                  </template>
                  Create Collection
                </n-button>
              </div>
            </HeadlessDialogPanel>
          </HeadlessTransitionChild>
        </div>
      </div>
    </HeadlessDialog>
  </HeadlessTransitionRoot>
</template>
