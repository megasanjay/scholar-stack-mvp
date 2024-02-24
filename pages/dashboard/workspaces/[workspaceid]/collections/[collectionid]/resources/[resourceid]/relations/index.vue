<script setup lang="ts">
import { Icon } from "#components";
import RESOURCE_TYPE_JSON from "@/assets/json/resource-type.json";

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

const resourceTypeOptions = RESOURCE_TYPE_JSON;

const groupedRelations = ref<GroupedRelations>({});

const showAddRelationDrawer = ref(false);
const showEditRelationDrawer = ref(false);

const selectedRelation = ref<GroupedRelation>({
  id: "",
  created: new Date(),
  resource_type: "",
  target: "",
  target_location: "",
  target_type: "",
  type: "",
  updated: new Date(),
});

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

const openAddRelationDrawer = () => {
  showAddRelationDrawer.value = true;
  selectedRelation.value = {
    id: useId(),
    created: new Date(),
    resource_type: "",
    target: "",
    target_location: "",
    target_type: "",
    type: "",
    updated: new Date(),
  };
};

const openEditRelationDrawer = (relation: GroupedRelation) => {
  selectedRelation.value = relation;
  showEditRelationDrawer.value = true;
};
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

          <n-button size="large" color="black" @click="openAddRelationDrawer">
            <template #icon>
              <Icon name="material-symbols-light:rebase-edit-rounded" />
            </template>

            Add relations
          </n-button>
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
              class="w-full space-x-8 rounded-xl border bg-white px-5 py-4 transition-all"
            >
              <n-space vertical size="large">
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

                <div class="flex items-center justify-between space-x-4">
                  <div class="flex items-center justify-start space-x-4">
                    <n-tag type="info"> {{ relation?.resource_type }} </n-tag>

                    <n-tag type="success">
                      {{ relation.target_type }}
                    </n-tag>
                  </div>

                  <div class="flex items-center space-x-4">
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
                  </div>
                </div>
              </n-space>
            </div>
          </n-space>
        </div>
      </n-space>
    </div>

    <ModalNewCollection />

    <n-drawer
      v-model:show="showAddRelationDrawer"
      :width="502"
      placement="right"
    >
      <n-drawer-content title="Add an internal relation ">
        <n-form>
          <n-form-item
            :path="`resource_type`"
            class="w-full"
            :rule="{
              message: 'Please select a resource type',
              required: true,
              trigger: ['blur', 'change'],
            }"
          >
            <template #label>
              <span class="font-medium">Resource Type</span>
            </template>

            <n-select
              v-model:value="selectedRelation.resource_type"
              filterable
              :options="resourceTypeOptions"
            /> </n-form-item
        ></n-form>
      </n-drawer-content>
    </n-drawer>
  </main>
</template>
