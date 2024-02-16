<script setup lang="ts">
import type { FormInst, SelectOption } from "naive-ui";
import { faker } from "@faker-js/faker";
import { nanoid } from "nanoid";
import { NTag, Icon, NDivider } from "#components";

import PREFIX_JSON from "@/assets/json/prefix.json";
import RELATION_TYPE_JSON from "@/assets/json/relation-type.json";
import RESOURCE_TYPE_JSON from "@/assets/json/resource-type.json";

definePageMeta({
  name: "relation:edit",
  layout: "app-layout",
  middleware: ["auth"],
});

const push = usePush();
const route = useRoute();

const collectionStore = useCollectionStore();
const resourceStore = useResourceStore();

await collectionStore.getCollection(
  route.params.workspaceid as string,
  route.params.collectionid as string,
);

const currentCollection = collectionStore.collection;

const currentResource = computed(() => {
  const resource = resourceStore.resources.find(
    (res) => res.id === route.params.resourceid,
  );

  if (resource) {
    return resource;
  }

  return null;
});

if (currentCollection?.version?.published) {
  navigateTo(
    `/dashboard/workspaces/${route.params.workspaceid}/collections/${route.params.collectionid}/resources/${route.params.resourceid}`,
  );
}

const formRef = ref<FormInst | null>(null);

const moduleData = reactive<Relations>({
  external: [],
  internal: [],
});

const typeOptions = PREFIX_JSON;
const relationTypeOptions = RELATION_TYPE_JSON;
const resourceTypeOptions = RESOURCE_TYPE_JSON;

const saveRelationsLoadingIndicator = ref(false);

const { collectionid, resourceid, workspaceid } = route.params as {
  collectionid: string;
  resourceid: string;
  workspaceid: string;
};

const { data: relations, error: relationsError } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations`,
  {
    headers: useRequestHeaders(["cookie"]),
  },
);

if (relationsError.value) {
  console.log(relationsError.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your relations",
  });

  navigateTo(
    `/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}`,
  );
}

if (relations.value) {
  moduleData.internal = relations.value.internal.map((relation) => {
    return {
      ...relation,
      action: relation.action || undefined,
      origin: "remote",
    };
  });
  moduleData.external = relations.value.external.map((relation) => {
    return {
      ...relation,
      action: relation.action || undefined,
      origin: "remote",
    };
  });
}

const {
  data: resourceList,
  error: resourceListError,
  pending: resourceListLoadingIndicator,
} = useLazyFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/resources?resourceid=${resourceid}`,
  {
    headers: useRequestHeaders(["cookie"]),
  },
);

// TODO: might need to make this into a watch statement
if (resourceListError.value) {
  console.log(resourceListError.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your resources",
  });
}

const renderLabel = (option: SelectOption): any => {
  return [
    option.versionLabel &&
      h(
        NTag,
        {
          class: "mr-2",
          size: "small",
          type: "info",
        },
        {
          default: () => option.versionLabel || "",
        },
      ),
    option.label as string,
    h(
      "span",
      {
        class: "text-gray-400 ml-2 text-xs",
      },
      {
        default: () => "Last revision: " + option.latestCollectionVersionName,
      },
    ),
  ];
};

const getResourceName = (resourceid: string) => {
  if (resourceList.value) {
    const resources = resourceList.value;

    const resource = resources.find((res) => res.value === resourceid);

    if (resource) {
      return resource.label;
    }
  }

  return "";
};

const addNewInternalRelation = () => {
  moduleData.internal.push({
    id: nanoid(),
    action: "create",
    created: new Date().toISOString(),
    origin: "local",
    original_relation_id: null,
    resource_type: null,
    target_id: null,
    type: null,
    updated: new Date().toISOString(),
  });
};

const removeInternalRelation = (id: string) => {
  const internalRelation = moduleData.internal.find(
    (relation) => relation.id === id,
  );

  if (internalRelation?.origin === "remote") {
    const {
      data: deleteInternalRelationData,
      error: deleteInternalRelationError,
    } = useFetch(
      `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations/${id}/internal`,
      {
        headers: useRequestHeaders(["cookie"]),
        method: "DELETE",
      },
    );

    if (deleteInternalRelationError.value) {
      console.log(deleteInternalRelationError.value);

      push.error({
        title: "Something went wrong",
        message: "We couldn't delete your relation",
      });

      throw new Error("We couldn't delete your relation");
    }

    if (deleteInternalRelationData.value) {
      console.log(deleteInternalRelationData.value.message);
    }
  }

  push.success({
    title: "Success",
    message: "Your relation has been deleted",
  });

  moduleData.internal = moduleData.internal.filter(
    (relation) => relation.id !== id,
  );
};

const addNewExternalRelation = () => {
  moduleData.external.push({
    id: nanoid(),
    action: "create",
    created: new Date().toISOString(),
    origin: "local",
    original_relation_id: null,
    resource_type: "poster",
    target: faker.internet.url(),
    target_type: "URL",
    type: "Cites",
    updated: new Date().toISOString(),
  });
};

const removeExternalRelation = async (id: string) => {
  const externalRelation = moduleData.external.find(
    (relation) => relation.id === id,
  );

  if (externalRelation?.origin === "remote") {
    const {
      data: deleteExternalRelationData,
      error: deleteExternalRelationError,
    } = await useFetch(
      `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations/${id}/external`,
      {
        headers: useRequestHeaders(["cookie"]),
        method: "DELETE",
      },
    );

    if (deleteExternalRelationError.value) {
      console.log(deleteExternalRelationError.value);

      push.error({
        title: "Something went wrong",
        message: "We couldn't delete your relation",
      });

      throw new Error("We couldn't delete your relation");
    }

    if (deleteExternalRelationData.value) {
      console.log(deleteExternalRelationData.value.message);
    }
  }

  push.success({
    title: "Success",
    message: "Your relation has been deleted",
  });

  if (!externalRelation?.original_relation_id) {
    moduleData.external = moduleData.external.filter(
      (relation) => relation.id !== id,
    );
  } else {
    externalRelation.action = "delete";
  }
};

const restoreExternalRelation = async (id: string) => {
  const externalRelation = moduleData.external.find(
    (relation) => relation.id === id,
  );

  if (externalRelation?.original_relation_id) {
    const {
      data: restoreExternalRelationData,
      error: restoreExternalRelationError,
    } = await useFetch(
      `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations/${id}/external/restore`,
      {
        headers: useRequestHeaders(["cookie"]),
        method: "PUT",
      },
    );

    if (restoreExternalRelationError.value) {
      console.log(restoreExternalRelationError.value);

      push.error({
        title: "Something went wrong",
        message: "We couldn't restore your relation",
      });

      throw new Error("We couldn't restore your relation");
    }

    if (restoreExternalRelationData.value) {
      const updatedAction = restoreExternalRelationData.value.updatedAction;

      externalRelation.action = updatedAction;
    }

    push.success({
      title: "Success",
      message: "Your relation has been restored",
    });
  }
};

const saveRelations = async () => {
  const body = {
    external: moduleData.external.map((relation) => {
      const data = {
        resource_type: relation.resource_type || "",
        target: relation.target,
        target_type: relation.target_type,
        type: relation.type,
      };

      if (relation.origin === "remote") {
        return {
          ...data,
          id: relation.id,
        };
      } else {
        return data;
      }
    }),
    internal: moduleData.internal.map((relation) => {
      const data = {
        resource_type: relation.resource_type || "",
        target_id: relation.target_id,
        type: relation.type,
      };

      if (relation.origin === "remote") {
        return {
          ...data,
          id: relation.id,
        };
      } else {
        return data;
      }
    }),
  };

  saveRelationsLoadingIndicator.value = true;

  const { data: saveRelationsData, error: saveRelationsError } = await useFetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations`,
    {
      body: JSON.stringify(body),
      headers: useRequestHeaders(["cookie"]),
      method: "PUT",
    },
  );

  saveRelationsLoadingIndicator.value = false;

  if (saveRelationsError.value) {
    console.log(saveRelationsError.value.message);

    push.error({
      title: "Something went wrong",
      message: "We couldn't save your relations",
    });

    throw new Error("We couldn't save your relations");
  }

  if (saveRelationsData.value) {
    moduleData.internal = saveRelationsData.value.relations.internal.map(
      (relation) => {
        return {
          ...relation,
          action: relation.action || undefined,
          origin: "remote",
        };
      },
    );

    moduleData.external = saveRelationsData.value.relations.external.map(
      (relation) => {
        return {
          ...relation,
          action: relation.action || undefined,
          origin: "remote",
        };
      },
    );

    push.success({
      title: "Success",
      message: "Your relations have been saved. Syncing...",
    });
  }
};
</script>

<template>
  <main class="bg-zinc-50">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <n-space align="center">
          <h1>Edit relations</h1>

          <n-tag type="warning">beta</n-tag>
        </n-space>

        <div class="flex items-center space-x-2">
          <n-button
            size="large"
            color="black"
            :loading="saveRelationsLoadingIndicator"
            @click="saveRelations"
          >
            <template #icon>
              <Icon name="humbleicons:save" />
            </template>

            Save changes
          </n-button>
        </div>
      </div>
    </div>

    <div
      class="mx-auto min-h-[calc(100vh-312px)] w-full max-w-screen-xl px-2.5 lg:px-20"
    >
      <n-form
        ref="formRef"
        :label-width="135"
        :model="moduleData"
        size="large"
        label-placement="left"
      >
        <div flex class="flex items-center justify-between py-10">
          <h2>Internal Relations</h2>

          <n-button color="black" @click="addNewInternalRelation">
            <template #icon>
              <Icon name="mdi:plus-network" />
            </template>

            Add a new internal relation
          </n-button>
        </div>

        <n-space vertical size="large">
          <div
            v-for="(relation, index) of moduleData.internal"
            :key="index"
            class="flex items-center justify-between space-x-8 rounded-xl border bg-white px-3 py-5"
          >
            <div class="flex w-full flex-col">
              <div class="flex w-full items-center">
                <n-form-item
                  :path="`internal[${index}].resource_type`"
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
                    v-model:value="relation.resource_type"
                    filterable
                    :options="resourceTypeOptions"
                  />
                </n-form-item>

                <n-form-item
                  :path="`internal[${index}].type`"
                  class="w-full"
                  :rule="{
                    message: 'Please select a relation type',
                    required: true,
                    trigger: ['blur', 'change'],
                  }"
                >
                  <template #label>
                    <span class="font-medium">Relation Type</span>
                  </template>

                  <n-select
                    v-model:value="relation.type"
                    filterable
                    :options="relationTypeOptions"
                  />
                </n-form-item>
              </div>

              <div class="flex w-full flex-col">
                <n-form-item
                  class="w-full"
                  :path="`internal[${index}].target_id`"
                  :rule="{
                    message: 'Please select a target',
                    required: true,
                    trigger: ['blur', 'change'],
                  }"
                >
                  <template #label>
                    <span class="font-medium">Target</span>
                  </template>

                  <n-select
                    v-model:value="relation.target_id"
                    filterable
                    :render-label="renderLabel"
                    :disabled="!!relation.original_relation_id"
                    :loading="resourceListLoadingIndicator"
                    :options="resourceList || []"
                  />
                </n-form-item>
              </div>

              <pre>
                {{ resourceList }}
              </pre>

              <div
                class="flex w-full items-center justify-between border-t pt-4"
              >
                <div>
                  <p
                    v-if="
                      relation.type &&
                      relation.resource_type &&
                      relation.target_id
                    "
                    class="text-sm"
                  >
                    The
                    <code>
                      {{ currentResource?.title }}
                    </code>
                    resource
                    <code>
                      {{ relation.type }}
                    </code>
                    a
                    <code>
                      {{ relation.resource_type }}
                    </code>
                    resource named
                    <code>
                      {{ getResourceName(relation.target_id) }}
                    </code>
                    .
                  </p>
                </div>

                <div class="flex w-max items-center">
                  <n-divider vertical />

                  <n-button
                    type="error"
                    secondary
                    @click="removeInternalRelation(relation.id)"
                  >
                    <template #icon>
                      <Icon name="iconoir:trash" />
                    </template>

                    Remove relation
                  </n-button>
                </div>
              </div>
            </div>
          </div>
        </n-space>

        <pre class="hidden">{{ moduleData.internal }}</pre>

        <n-divider class="hidden" />

        <div class="flex items-center justify-between py-10">
          <h2>External Relations</h2>

          <n-button color="black" @click="addNewExternalRelation">
            <template #icon>
              <Icon name="tabler:link-plus" />
            </template>

            Add a new external relation
          </n-button>
        </div>

        <div class="flex flex-col space-y-8">
          <div
            v-for="(relation, index) of moduleData.external"
            :key="index"
            class="flex items-center justify-between space-x-8 rounded-xl border bg-white px-6 py-6 shadow-lg"
          >
            <div class="flex w-full flex-col">
              <div class="flex w-full items-center">
                <n-form-item
                  :path="`external[${index}].resource_type`"
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
                    v-model:value="relation.resource_type"
                    filterable
                    :disabled="relation.action === 'delete'"
                    :options="resourceTypeOptions"
                  />
                </n-form-item>

                <n-form-item
                  class="w-full"
                  :path="`external[${index}].type`"
                  :rule="{
                    message: 'Please select a relation type',
                    required: true,
                    trigger: ['blur', 'change'],
                  }"
                >
                  <template #label>
                    <span class="font-medium">Relation Type</span>
                  </template>

                  <n-select
                    v-model:value="relation.type"
                    :disabled="relation.action === 'delete'"
                    filterable
                    :options="relationTypeOptions"
                  />
                </n-form-item>
              </div>

              <div class="flex w-full flex-col">
                <n-form-item
                  :path="`external[${index}].target_type`"
                  :rule="{
                    message: 'Please select a target type',
                    required: true,
                    trigger: ['blur', 'change'],
                  }"
                >
                  <template #label>
                    <span class="font-medium">Target Type</span>
                  </template>

                  <n-select
                    v-model:value="relation.target_type"
                    :disabled="!!relation.original_relation_id"
                    filterable
                    :options="typeOptions"
                  />
                </n-form-item>

                <n-form-item
                  :path="`external[${index}].target`"
                  :rule="{
                    message: 'Please enter a target',
                    required: true,
                    trigger: ['blur', 'input'],
                  }"
                >
                  <template #label>
                    <span class="font-medium">Target</span>
                  </template>

                  <n-input
                    v-model:value="relation.target"
                    :disabled="!!relation.original_relation_id"
                    placeholder="https://example.com"
                  />
                </n-form-item>
              </div>

              <div
                class="flex w-full items-center justify-between border-t pt-4"
              >
                <div>
                  <p
                    v-if="
                      relation.type &&
                      relation.resource_type &&
                      relation.target_type &&
                      relation.target
                    "
                    class="text-sm"
                  >
                    The
                    <code>
                      {{ currentResource?.title }}
                    </code>
                    resource
                    <code>
                      {{ relation.type }}
                    </code>
                    a
                    <code>
                      {{ relation.resource_type }}
                    </code>
                    resource identified by the
                    <code>
                      {{ relation.target_type }} {{ relation.target }}
                    </code>
                    .
                  </p>
                </div>

                <div class="flex w-max items-center">
                  <n-divider
                    v-if="
                      relation.type &&
                      relation.resource_type &&
                      relation.target_type &&
                      relation.target
                    "
                    vertical
                  />

                  <n-space class="w-max">
                    <n-tag
                      v-if="
                        'action' in relation && relation.action === 'create'
                      "
                      type="info"
                    >
                      New
                    </n-tag>

                    <n-tag
                      v-if="
                        'action' in relation && relation.action === 'update'
                      "
                      type="warning"
                    >
                      Updated
                    </n-tag>

                    <n-tag
                      v-if="
                        'action' in relation && relation.action === 'delete'
                      "
                      type="error"
                    >
                      Deleted
                    </n-tag>

                    <n-tooltip
                      v-if="
                        relation.origin === 'remote' &&
                        !currentCollection?.version?.published
                      "
                      trigger="hover"
                    >
                      <template #trigger>
                        <Icon
                          size="28"
                          class="text-emerald-500"
                          name="material-symbols:cloud-done"
                        />
                      </template>
                      This relation has been saved. Publishing this collection
                      will push your relations to the public portal.
                    </n-tooltip>

                    <n-tooltip
                      v-if="
                        relation.origin === 'local' &&
                        !currentCollection?.version?.published
                      "
                      trigger="hover"
                    >
                      <template #trigger>
                        <Icon
                          size="28"
                          class="text-orange-400"
                          name="mdi:cloud-upload"
                        />
                      </template>
                      This relation has not been saved yet
                    </n-tooltip>
                  </n-space>

                  <n-divider vertical />

                  <n-button
                    v-if="relation.action !== 'delete'"
                    type="error"
                    secondary
                    @click="removeExternalRelation(relation.id)"
                  >
                    <template #icon>
                      <Icon name="iconoir:trash" />
                    </template>

                    Remove relation
                  </n-button>

                  <n-button
                    v-if="relation.action === 'delete'"
                    type="warning"
                    secondary
                    @click="restoreExternalRelation(relation.id)"
                  >
                    <template #icon>
                      <Icon name="mdi:restore" />
                    </template>

                    Restore relation
                  </n-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <n-divider v-if="moduleData.external.length > 0" />

        <pre v-if="moduleData.external.length > 0">{{
          moduleData.external
        }}</pre>
      </n-form>
    </div>

    <ModalNewCollection />
  </main>
</template>
