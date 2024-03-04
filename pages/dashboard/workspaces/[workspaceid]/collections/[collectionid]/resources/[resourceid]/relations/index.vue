<script setup lang="ts">
import { nanoid } from "nanoid";
import type { SelectOption, FormInst, FormItemRule } from "naive-ui";
import { faker } from "@faker-js/faker";
import { NTag, Icon } from "#components";
import PREFIX_JSON from "@/assets/json/prefix.json";
import RELATION_TYPE_JSON from "@/assets/json/relation-type.json";
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

const typeOptions = PREFIX_JSON;
const relationTypeOptions = RELATION_TYPE_JSON;
const resourceTypeOptions = RESOURCE_TYPE_JSON;

const showRelationDrawer = ref(false);
const addNewRelationLoading = ref(false);
const editRelationLoading = ref(false);

const drawerAction = ref<"Add" | "Edit">("Add");

const formRef = ref<FormInst | null>(null);
// const groupedRelations = ref<GroupedRelations>({});
const selectedRelation = ref<GroupedRelation>({
  id: "",
  created: new Date(),
  external: true,
  resource_type: null,
  target: "",
  target_type: null,
  type: null,
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

const groupedRelations = computed(() => {
  const grouped: GroupedRelations = {};

  if (relations.value) {
    // group relation by type
    for (const relation of relations.value) {
      if (relation.type) {
        if (relation.type in grouped) {
          grouped[relation.type].push(relation as unknown as GroupedRelation);
        } else {
          grouped[relation.type] = [relation as unknown as GroupedRelation];
        }
      }
    }
  }

  Object.keys(grouped).forEach((key) => {
    const group = grouped[key];

    if (group) {
      group.sort((a, b) => {
        if (a.updated > b.updated) {
          return -1;
        }

        if (a.updated < b.updated) {
          return 1;
        }

        return 0;
      });
    }
  });

  return grouped;
});

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
        default: () => {
          if (option.latestCollectionVersionName) {
            return "Last revision: " + option.latestCollectionVersionName;
          } else {
            return "";
          }
        },
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

const getRelationName = (relationType: string) => {
  const relation = relationTypeOptions.find((r) => r.value === relationType);

  return relation?.label || relationType;
};

const selectedIdentifier = computed(() => {
  return typeOptions.find(
    (prefix) => prefix.value === selectedRelation.value.target_type,
  );
});

const selectedIdentiferValidator = (rule: FormItemRule, value: string) => {
  if (!value) {
    return new Error("Please enter your identifier");
  }

  if (selectedIdentifier.value && selectedIdentifier.value.pattern) {
    const pattern = new RegExp(selectedIdentifier.value.pattern);

    if (!pattern.test(value)) {
      return new Error(
        `Please enter a valid ${selectedIdentifier.value.label}`,
      );
    }
  }

  return true;
};

const openAddRelationDrawer = (targetLocation: string) => {
  selectedRelation.value = {
    id: nanoid(),
    created: new Date(),
    external: true,
    resource_type: null,
    target: "",
    target_type: null,
    type: null,
    updated: new Date(),
  };

  drawerAction.value = "Add";

  if (targetLocation === "internal") {
    selectedRelation.value.external = false;
  } else {
    selectedRelation.value.resource_type = "poster";
    selectedRelation.value.type = "Cites";
    selectedRelation.value.target_type = "url";
    selectedRelation.value.target = faker.internet.url();
  }

  showRelationDrawer.value = true;
};

const openEditRelationDrawer = (id: string) => {
  const relation = relations.value?.find((r) => r.id === id);

  if (relation) {
    /**
     * TODO: the dates need to be fixed. Not sure where ts thinks the dates are strings
     */

    selectedRelation.value = {
      id: relation.id,
      created: new Date(),
      external: relation.external,
      resource_type: relation.resource_type,
      target: relation.target,
      target_type: relation.external ? relation.target_type : null,
      type: relation.type,
      updated: new Date(),
    };

    drawerAction.value = "Edit";

    showRelationDrawer.value = true;
  } else {
    push.error("Something went wrong");
  }
};

const deleteRelation = async (relationid: string) => {
  const relation = relations.value?.find((r) => r.id === relationid);

  if (!relation) {
    push.error("Something went wrong");
    return;
  }

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations/${relation.external ? "external" : "internal"}/${relationid}`,
    {
      headers: useRequestHeaders(["cookie"]),
      method: "DELETE",
    },
  )
    .then((response) => {
      if (response.statusCode === 204) {
        if (relation.original_relation_id) {
          relation.action = "delete";

          push.success("Your relation has been marked for deletion");
        } else {
          const index =
            relations.value?.findIndex((r) => r.id === relationid) ?? -1;

          if (index > -1) {
            relations.value?.splice(index, 1);
          } else {
            push.error("Something went wrong");
          }

          push.success("Your relation has been deleted");
        }
      } else {
        push.error("Something went wrong");
      }
    })
    .catch((error) => {
      console.error(error);
      push.error("Something went wrong");
    });
};

const addNewRelation = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      if (selectedRelation.value.external) {
        const d = {
          resourceType: selectedRelation.value.resource_type,
          target: selectedRelation.value.target,
          targetType: selectedRelation.value.target_type,
          type: selectedRelation.value.type,
        };

        addNewRelationLoading.value = true;

        const { data: newExternalRelation } = await $fetch(
          `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations/external`,
          {
            body: JSON.stringify(d),
            headers: useRequestHeaders(["cookie"]),
            method: "POST",
          },
        );

        addNewRelationLoading.value = false;

        if (newExternalRelation) {
          // Also add the relation to the main relations array
          relations.value?.push(newExternalRelation);

          push.success("Your relation has been added");

          showRelationDrawer.value = false;
        } else {
          push.error("Something went wrong");
        }
      } else {
        const d = {
          resourceType: selectedRelation.value.resource_type,
          target: selectedRelation.value.target,
          type: selectedRelation.value.type,
        };

        addNewRelationLoading.value = true;

        await $fetch(
          `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations/internal`,
          {
            body: JSON.stringify(d),
            headers: useRequestHeaders(["cookie"]),
            method: "POST",
          },
        )
          .then((response) => {
            if (response.statusCode === 201) {
              // Also add the relation to the main relations array
              relations.value?.push(response.data);

              push.success("Your relation has been added");

              showRelationDrawer.value = false;
            } else {
              push.error("Something went wrong");
            }
          })
          .catch((error) => {
            console.error(error);
            push.error("Something went wrong");
          })
          .finally(() => {
            addNewRelationLoading.value = false;
          });
      }
    } else {
      console.log(errors);
      push.error("Invalid");
    }
  });
};

const editRelation = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      if (selectedRelation.value.external) {
        const d = {
          resourceType: selectedRelation.value.resource_type,
          target: selectedRelation.value.target,
          targetType: selectedRelation.value.target_type,
          type: selectedRelation.value.type,
        };

        editRelationLoading.value = true;

        await $fetch(
          `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations/external/${selectedRelation.value.id}`,
          {
            body: JSON.stringify(d),
            headers: useRequestHeaders(["cookie"]),
            method: "PUT",
          },
        )
          .then((response) => {
            editRelationLoading.value = false;

            if (response.statusCode === 200) {
              // Also update the relation in the main relations array
              const index =
                relations.value?.findIndex(
                  (r) => r.id === selectedRelation.value.id,
                ) ?? -1;

              if (index > -1 && relations.value) {
                relations.value[index] = response.data;
              } else {
                push.error("Something went wrong");
              }

              push.success("Your relation has been updated");

              showRelationDrawer.value = false;
            } else {
              push.error("Something went wrong");
            }
          })
          .catch((error) => {
            console.error(error);
            push.error("Something went wrong");
          })
          .finally(() => {
            editRelationLoading.value = false;
          });
      } else {
        const d = {
          resourceType: selectedRelation.value.resource_type,
          target: selectedRelation.value.target,
          type: selectedRelation.value.type,
        };

        editRelationLoading.value = true;

        await $fetch(
          `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations/internal/${selectedRelation.value.id}`,
          {
            body: JSON.stringify(d),
            headers: useRequestHeaders(["cookie"]),
            method: "PUT",
          },
        )
          .then((response) => {
            editRelationLoading.value = false;

            if (response.statusCode === 200) {
              // Also update the relation in the main relations array
              const index =
                relations.value?.findIndex(
                  (r) => r.id === selectedRelation.value.id,
                ) ?? -1;

              if (index > -1 && relations.value) {
                relations.value[index] = response.data;
              } else {
                push.error("Something went wrong");
              }

              push.success("Your relation has been updated");

              showRelationDrawer.value = false;
            } else {
              push.error("Something went wrong");
            }
          })
          .catch((error) => {
            console.error(error);
            push.error("Something went wrong");
          })
          .finally(() => {
            editRelationLoading.value = false;
          });
      }
    } else {
      console.error(errors);
      push.error("Invalid");
    }
  });
};

const restoreRelation = async (relationid: string) => {
  const relation = relations.value?.find((r) => r.id === relationid);

  if (!relation) {
    push.error("Something went wrong");
    return;
  }

  const d = {
    action: "restore",
  };

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/${resourceid}/relations/${relation.external ? "external" : "internal"}/${relationid}`,
    {
      body: JSON.stringify(d),
      headers: useRequestHeaders(["cookie"]),
      method: "PATCH",
    },
  )
    .then((response) => {
      if (response.statusCode === 200) {
        relation.action = response.updatedAction;

        push.success("Your relation has been restored");
      } else {
        push.error("Something went wrong");
      }
    })
    .catch((error) => {
      console.error(error);
      push.error("Something went wrong");
    });
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
          <n-button
            size="large"
            color="black"
            @click="openAddRelationDrawer('external')"
          >
            <template #icon>
              <Icon name="material-symbols-light:rebase-edit-rounded" />
            </template>

            Add external relation
          </n-button>

          <n-button
            size="large"
            color="black"
            @click="openAddRelationDrawer('internal')"
          >
            <template #icon>
              <Icon name="material-symbols-light:rebase-edit-rounded" />
            </template>

            Add internal relation
          </n-button>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 pb-10 lg:px-20">
      <n-space vertical size="large" class="w-full">
        <div v-for="(gr, name, index) in groupedRelations" :key="index">
          <div flex class="flex items-center justify-between pb-5 pt-10">
            <h2>{{ getRelationName(name as string) }}</h2>
          </div>

          <n-space vertical size="large" class="w-full">
            <div
              v-for="(relation, idx) of gr || []"
              :key="idx"
              class="w-full space-x-8 rounded-xl border px-5 py-4 transition-all"
              :class="{
                'border-slate-300 bg-white':
                  !relation.action || relation.action === 'clone',
                'cursor-not-allowed border-red-300 bg-red-50':
                  relation.action === 'delete',
                'border-emerald-400 bg-emerald-50/20':
                  relation.action === 'update',
                'border-blue-300 bg-cyan-50/20': relation.action === 'create',
              }"
            >
              <n-space vertical size="large">
                <div class="group w-max">
                  <NuxtLink
                    v-if="relation.external"
                    :to="
                      relation.target_type !== 'url'
                        ? `https://identifiers.org/${relation.target_type}:${relation.target}`
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

                  <div v-else class="flex items-center font-medium">
                    {{ getResourceName(relation.target) }}
                  </div>
                </div>

                <div class="flex items-center justify-between space-x-4">
                  <div class="flex items-center justify-start space-x-4">
                    <n-tag type="info"> {{ relation?.resource_type }} </n-tag>

                    <n-tag v-if="relation.target_type" type="success">
                      {{ relation.target_type }}
                    </n-tag>
                  </div>

                  <div
                    v-if="!currentCollection?.version?.published"
                    class="flex items-center space-x-4"
                  >
                    <n-space>
                      <n-tag
                        v-if="relation.action === 'create'"
                        type="info"
                        size="medium"
                      >
                        <template #icon>
                          <Icon name="mdi:new-box" size="16" />
                        </template>
                        New Relation
                      </n-tag>

                      <n-tag
                        v-if="relation.action === 'update'"
                        type="success"
                        size="medium"
                      >
                        <template #icon>
                          <Icon
                            name="mdi:file-document-edit-outline"
                            size="16"
                          />
                        </template>
                        Updated
                      </n-tag>

                      <n-tag
                        v-if="relation.action === 'delete'"
                        type="error"
                        size="medium"
                      >
                        <template #icon>
                          <Icon name="mdi:delete-outline" size="16" />
                        </template>
                        Marked for deletion
                      </n-tag>
                    </n-space>

                    <div>
                      <n-divider
                        v-if="relation.action && relation.action !== 'clone'"
                        vertical
                      />
                    </div>

                    <n-button
                      v-if="relation.action !== 'delete'"
                      type="info"
                      :disabled="relation.action === 'delete'"
                      @click="openEditRelationDrawer(relation.id)"
                    >
                      <template #icon>
                        <Icon name="mdi:file-document-edit-outline" />
                      </template>

                      Edit
                    </n-button>

                    <n-button
                      v-if="relation.action !== 'delete'"
                      type="error"
                      @click="deleteRelation(relation.id)"
                    >
                      <template #icon>
                        <Icon name="mdi:delete-outline" />
                      </template>

                      Delete
                    </n-button>

                    <n-button
                      v-if="relation.action === 'delete'"
                      type="warning"
                      @click="restoreRelation(relation.id)"
                    >
                      <template #icon>
                        <Icon name="mdi:undo" />
                      </template>

                      Undo delete
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

    <n-drawer v-model:show="showRelationDrawer" :width="502" placement="right">
      <n-drawer-content
        :title="`${drawerAction} an ${selectedRelation.external ? 'external' : 'internal'} relation`"
        :mask-closable="!addNewRelationLoading && !editRelationLoading"
        :close-on-esc="!addNewRelationLoading && !editRelationLoading"
      >
        <n-form ref="formRef" :model="selectedRelation" size="large">
          <n-form-item
            path="resource_type"
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
              clearable
              :options="resourceTypeOptions"
              placeholder="Dataset"
            />
          </n-form-item>

          <n-form-item
            path="type"
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
              v-model:value="selectedRelation.type"
              filterable
              clearable
              :options="relationTypeOptions"
              placeholder="isPartOf"
            />
          </n-form-item>

          <n-form-item
            v-if="selectedRelation.external"
            path="target_type"
            :rule="{
              message: 'Please select a target type',
              required: selectedRelation.external,
              trigger: ['blur', 'change'],
            }"
          >
            <template #label>
              <span class="font-medium">Target Type</span>
            </template>

            <n-select
              v-model:value="selectedRelation.target_type"
              :disabled="!!selectedRelation.original_relation_id"
              filterable
              clearable
              :options="typeOptions"
              placeholder="DOI"
            />
          </n-form-item>

          <n-form-item
            v-if="selectedRelation.external"
            path="target"
            :rule="{
              validator: selectedIdentiferValidator,
              required: selectedRelation.external,
              trigger: ['blur', 'input'],
            }"
          >
            <template #label>
              <span class="font-medium">Target</span>
            </template>

            <n-input
              v-model:value="selectedRelation.target"
              clearable
              :disabled="!!selectedRelation.original_relation_id"
              :placeholder="selectedIdentifier?.placeholder"
            />
          </n-form-item>

          <n-form-item
            v-if="!selectedRelation.external"
            path="target"
            :rule="{
              message: 'Please select a target',
              required: !selectedRelation.external,
              trigger: ['blur', 'change'],
            }"
          >
            <template #label>
              <span class="font-medium">Target</span>
            </template>

            <n-select
              v-model:value="selectedRelation.target"
              filterable
              clearable
              :render-label="renderLabel"
              :disabled="!!selectedRelation.original_relation_id"
              :loading="resourceListLoadingIndicator"
              :options="resourceList || []"
            />
          </n-form-item>
        </n-form>

        <pre>
          {{ selectedRelation }}
           {{ selectedIdentifier }}
        </pre>

        <template #footer>
          <n-button
            type="info"
            :loading="addNewRelationLoading || editRelationLoading"
            size="large"
            @click="
              () => {
                drawerAction === 'Add' ? addNewRelation() : editRelation();
              }
            "
          >
            <template #icon>
              <Icon name="material-symbols:save-sharp" />
            </template>
            Save relation
          </n-button>
        </template>
      </n-drawer-content>
    </n-drawer>
  </main>
</template>
