<script setup lang="ts">
import { Icon } from "#components";

definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const route = useRoute();

const collectionStore = useCollectionStore();

const { collectionid, resourceid, workspaceid } = route.params as {
  collectionid: string;
  resourceid: string;
  workspaceid: string;
};

const currentCollection = computed(() => {
  return (
    collectionStore.collection || {
      version: {
        published: false,
      },
    }
  );
});

const { data: resource, error } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}`,
  {
    headers: useRequestHeaders(["cookie"]),
  },
);

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your resource",
  });

  navigateTo(
    `/dashboard/workspaces/${workspaceid}/collections/${collectionid}`,
  );
}

if (resource.value) {
  // If the resource is marked for deletion, redirect the user
  // to the collection page
  if (
    "action" in resource.value &&
    (resource.value.action === "delete" ||
      resource.value.action === "oldVersion")
  ) {
    push.error({
      title: "Resource marked for deletion",
      message: "You will need to undelete this resource before you can view it",
    });

    navigateTo(
      `/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources`,
    );

    throw new Error("Resource marked for deletion");
  }
}

const { data: relations, error: relationsError } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations`,
  {
    headers: useRequestHeaders(["cookie"]),
  },
);

const groupedRelations = ref<GroupedRelations>({});

if (relations.value) {
  // group relation by type
  for (const relation of relations.value) {
    if (relation.type in groupedRelations.value) {
      groupedRelations.value[relation.type].push(
        relation as unknown as GroupedRelation,
      );
    } else {
      groupedRelations.value[relation.type] = [
        relation as unknown as GroupedRelation,
      ];
    }
  }
}
</script>

<template>
  <main class="h-full bg-white">
    <div
      class="flex h-36 w-full items-center border-b border-gray-200 bg-white"
    >
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <n-space vertical>
          <n-space align="center">
            <h1>Relations</h1>

            <n-tag type="warning">beta</n-tag>
          </n-space>

          <n-tag v-if="resource?.back_link_id" type="info" size="large">
            {{ resource?.back_link_id }}
          </n-tag>
        </n-space>

        <div class="flex items-center space-x-2">
          <NuxtLink
            v-if="!currentCollection?.version?.published"
            :to="`/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations/edit`"
          >
            <n-button size="large" color="black">
              <template #icon>
                <Icon name="material-symbols-light:rebase-edit-rounded" />
              </template>

              Update relations
            </n-button>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 lg:px-20">
      <n-space vertical size="large" class="w-full">
        <div v-for="(gr, name, index) in groupedRelations" :key="index">
          <div flex class="flex items-center justify-between py-10">
            <h2>{{ name }}</h2>
          </div>

          <pre>{{ gr }}</pre>

          <n-space vertical size="large" class="w-full">
            <div
              v-for="(relation, idx) of gr || []"
              :key="idx"
              class="w-full space-x-8 rounded-xl border bg-white px-3 py-5 transition-all"
            >
              <n-space vertical size="large">
                <n-space justify="space-between">
                  <n-tag type="info">{{ relation?.resource_type }}</n-tag>

                  <n-space justify="end">
                    <n-button type="info">
                      <template #icon>
                        <Icon name="mdi:file-document-edit-outline" />
                      </template>

                      Edit
                    </n-button>

                    <n-button type="error">
                      <template #icon>
                        <Icon name="mdi:delete-outline" />
                      </template>

                      Delete
                    </n-button>
                  </n-space>
                </n-space>

                <div class="flex w-full items-center space-x-1 pb-4 pt-3">
                  <n-tag
                    v-if="'target_type' in relation"
                    type="info"
                    size="small"
                  >
                    {{ relation.target_type }}
                  </n-tag>

                  <div>
                    <n-divider vertical />
                  </div>

                  <div class="group w-max">
                    <NuxtLink
                      :to="
                        relation.target_type !== 'url'
                          ? `https://identifiers.org/${relation.type}/${relation.target}`
                          : relation.target
                      "
                      class="flex items-center font-medium text-blue-600 transition-all group-hover:text-blue-700 group-hover:underline"
                      target="_blank"
                      @click.stop=""
                    >
                      {{ relation.target }}

                      <Icon
                        name="mdi:external-link"
                        size="16"
                        class="ml-1 text-blue-600 transition-all group-hover:text-blue-700 group-hover:underline"
                      />
                    </NuxtLink>
                  </div>
                </div>
              </n-space>
            </div>
          </n-space>
        </div>
      </n-space>
    </div>

    <ModalNewCollection />
  </main>
</template>
