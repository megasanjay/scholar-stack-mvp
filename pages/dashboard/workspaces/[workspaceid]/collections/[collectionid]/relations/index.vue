<script setup lang="ts">
import type { FormError, FormSubmitEvent, FormErrorEvent } from "#ui/types";
import { nanoid } from "nanoid";
import { faker } from "@faker-js/faker";

import PREFIX_JSON from "@/assets/json/prefix.json";
import RELATION_TYPE_JSON from "@/assets/json/relation-type.json";
import RESOURCE_TYPE_JSON from "@/assets/json/relation-resource-type.json";
import { UBadge, UButton, USeparator } from "#components";

definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

useSeoMeta({
  title: "Relations",
});

const devMode = process.env.NODE_ENV === "development";

const toast = useToast();
const route = useRoute();

const collectionStore = useCollectionStore();

const { collectionid, workspaceid } = route.params as {
  collectionid: string;
  workspaceid: string;
};

const createForm = useTemplateRef("createForm");

const typeOptions = PREFIX_JSON;
const relationTypeOptions = RELATION_TYPE_JSON;
const resourceTypeOptions = RESOURCE_TYPE_JSON;

const showRelationDrawer = ref(false);
const addNewRelationLoading = ref(false);
const editRelationLoading = ref(false);

const drawerAction = ref<"Add" | "Edit">("Add");

// const groupedRelations = ref<GroupedRelations>({});

const selectedRelation = ref<GroupedRelation>({
  id: "",
  created: new Date(),
  external: true,
  originalRelationId: null,
  resourceType: null,
  source: null,
  target: null,
  targetType: null,
  type: null,
  updated: new Date(),
});

const validateForm = (_state: any): FormError[] => {
  const errrors = [];

  if (!selectedRelation.value.source) {
    errrors.push({
      name: "source",
      message: "Source is required",
    });
  }

  if (!selectedRelation.value.target) {
    errrors.push({
      name: "target",
      message: "Target is required",
    });
  }

  if (!selectedRelation.value.type) {
    errrors.push({
      name: "type",
      message: "Relation type is required",
    });
  }

  if (!selectedRelation.value.resourceType) {
    errrors.push({
      name: "resourceType",
      message: "Resource type is required",
    });
  }

  if (selectedRelation.value.external) {
    if (!selectedRelation.value.targetType) {
      errrors.push({
        name: "targetType",
        message: "Target type is required",
      });
    }
  }

  return errrors;
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

const allRelations = ref<AllRelationsItem[]>([]);

const { data, error } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/relations`,
  {},
);

if (error.value) {
  console.log(error.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    description: "We couldn't load your relations",
    icon: "material-symbols:error",
  });

  navigateTo(
    `/dashboard/workspaces/${workspaceid}/collections/${collectionid}`,
  );
}

if (data.value) {
  allRelations.value = data.value;
}

const groupedResources = computed(() => {
  const grouped: GGR = {};

  if (allRelations.value) {
    // Create a list of source resources
    for (const relation of allRelations.value) {
      if (!relation.source) {
        continue;
      }

      // if relation.source not in grouped, add it
      if (!(relation.source in grouped)) {
        grouped[relation.source] = {
          name: relation.sourceName || "Untitled Resource",
          relations: {},
        };
      }

      const formattedRelation = {
        ...relation,
      };

      // Create a nested list under the source resource but for relation type
      if (relation.type in grouped[relation.source].relations) {
        grouped[relation.source].relations[relation.type].push(
          formattedRelation,
        );
      } else {
        grouped[relation.source].relations[relation.type] = [formattedRelation];
      }
    }
  }

  return grouped;
});

const sourceResourceList = ref<any>([]);
const sourceResourceListLoadingIndicator = ref(false);

const targetResourceList = ref<any>([]);
const targetResourceListLoadingIndicator = ref(false);

const getSourceResourceList = async () => {
  sourceResourceListLoadingIndicator.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/resources/source`,
    {},
  )
    .then((response) => {
      sourceResourceList.value = response;
    })
    .catch((error) => {
      console.error(error);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't load your source resources",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      sourceResourceListLoadingIndicator.value = false;
    });
};

const getTargetResourceList = async (resourceid: string) => {
  targetResourceListLoadingIndicator.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/resources${resourceid ? `?resourceid=${resourceid}` : ``}`,
    {},
  )
    .then((response) => {
      targetResourceList.value = response;
    })
    .catch((error) => {
      console.error(error);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't load your target resources",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      targetResourceListLoadingIndicator.value = false;
    });
};

const generateTargetResourceListOptions = () => {
  const selectedSourceResource = selectedRelation.value.source;

  if (!selectedSourceResource) {
    return [];
  }

  const newTargetResourceListOptions = targetResourceList.value.map(
    (resource: any) => {
      return {
        ...resource,
        disabled:
          resource.value === selectedSourceResource ||
          resource.action === "delete" ||
          resource.action === "oldVersion",
      };
    },
  );

  return newTargetResourceListOptions || [];
};

const getRelationName = (relationType: string) => {
  const relation = relationTypeOptions.find((r) => r.value === relationType);

  return relation?.label || relationType;
};

const getResourceTypeName = (resourceType: string) => {
  // First we need to flatten the resourceTypeOptions array
  const flattenedResourceTypeOptions = resourceTypeOptions.reduce(
    (acc, curr) => {
      if (curr.children) {
        // Attach the parent label as a prefix to the child labels
        acc.push(
          ...curr.children.map((child) => ({
            ...child,
            label: `${curr.label} - ${child.label}`,
          })),
        );
      } else {
        acc.push(curr);
      }

      return acc;
    },
    [] as any[],
  );

  // Then we need to find the resourceType in the flattened array
  const resourceTypeOption = flattenedResourceTypeOptions.find(
    (r) => r.value === resourceType,
  );

  if (resourceTypeOption) {
    return resourceTypeOption.label;
  }

  return resourceType;

  // const resource = resourceTypeOptions.find((r) => r.value === resourceType);

  // return resource?.label || resourceType;
};

const getResourceIdentifierTypeName = (identifierType: string) => {
  const identifierTypeOption = typeOptions.find(
    (r) => r.value === identifierType,
  );

  if (identifierTypeOption) {
    return identifierTypeOption.label;
  }

  return identifierType;
};

const generateAddRelationFromDropdownOptions = (resourceid: string) => {
  return [
    {
      key: "external",
      label: "Add an external relation",
      onSelect: () => {
        openAddRelationDrawer("external", resourceid);
      },
    },
    {
      key: "internal",
      label: "Add an internal relation",
      onSelect: () => {
        openAddRelationDrawer("internal", resourceid);
      },
    },
  ];
};

const openAddRelationDrawer = (
  targetLocation: string,
  sourceid: string = "",
) => {
  getSourceResourceList();
  getTargetResourceList(sourceid);

  selectedRelation.value = {
    id: nanoid(),
    created: new Date(),
    external: true,
    resourceType: null,
    source: null,
    target: null,
    targetType: null,
    type: null,
    updated: new Date(),
  };

  drawerAction.value = "Add";

  if (targetLocation === "internal") {
    selectedRelation.value.external = false;
  } else {
    selectedRelation.value.resourceType = "poster";
    selectedRelation.value.type = "Cites";
    selectedRelation.value.targetType = "url";
    selectedRelation.value.target = faker.internet.url();
  }

  if (sourceid) {
    selectedRelation.value.source = sourceid;
  }

  showRelationDrawer.value = true;
};

const openEditRelationDrawer = (id: string) => {
  const relation = allRelations.value?.find((r) => r.id === id);

  if (relation) {
    getSourceResourceList();
    getTargetResourceList(relation.source || "");

    /**
     * TODO: the dates need to be fixed. Not sure where ts thinks the dates are strings
     */

    selectedRelation.value = {
      id: relation.id,
      created: new Date(),
      external: relation.external,
      originalRelationId: relation.originalRelationId,
      resourceType: relation.resourceType,
      source: relation.source,
      target: relation.target,
      targetType: relation.external ? (relation.targetType ?? null) : null,
      type: relation.type,
      updated: new Date(),
    };

    drawerAction.value = "Edit";

    showRelationDrawer.value = true;
  } else {
    toast.add({
      title: "Something went wrong",
      color: "error",
      description: "We couldn't load your relation",
      icon: "material-symbols:error",
    });
  }
};

const relationBeingDeleted = ref("");

const deleteRelation = async (relationid: string) => {
  const relation = allRelations.value?.find((r) => r.id === relationid);

  if (!relation) {
    toast.add({
      title: "Something went wrong",
      color: "error",
      description: "We couldn't load your relation",
      icon: "material-symbols:error",
    });

    return;
  }

  relationBeingDeleted.value = relationid;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/relations/${relation.external ? "external" : "internal"}/${relationid}`,
    {
      method: "DELETE",
    },
  )
    .then((response) => {
      if (response.statusCode === 204) {
        if (relation.originalRelationId) {
          relation.action = "delete";

          toast.add({
            title: "Relation marked for deletion",
            color: "success",
            description: "Your relation has been marked for deletion",
            icon: "material-symbols:check-circle",
          });
        } else {
          const index =
            allRelations.value?.findIndex((r) => r.id === relationid) ?? -1;

          if (index > -1) {
            allRelations.value?.splice(index, 1);
          } else {
            toast.add({
              title: "Something went wrong",
              color: "error",
              description: "We couldn't delete your relation",
              icon: "material-symbols:error",
            });
          }

          toast.add({
            title: "Relation deleted",
            color: "success",
            description: "Your relation has been deleted",
            icon: "material-symbols:check-circle",
          });
        }
      } else {
        toast.add({
          title: "Something went wrong",
          color: "error",
          description: "We couldn't delete your relation",
          icon: "material-symbols:error",
        });
      }
    })
    .catch((error) => {
      console.error(error);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't delete your relation",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      relationBeingDeleted.value = "";
    });
};

const addNewRelation = async () => {
  if (selectedRelation.value.external) {
    const d = {
      resourceType: selectedRelation.value.resourceType,
      source: selectedRelation.value.source,
      target: selectedRelation.value.target,
      targetType: selectedRelation.value.targetType,
      type: selectedRelation.value.type,
    };

    addNewRelationLoading.value = true;

    await $fetch(
      `/api/workspaces/${workspaceid}/collections/${collectionid}/relations/external`,
      {
        body: JSON.stringify(d),

        method: "POST",
      },
    )
      .then((response) => {
        console.log(response);

        allRelations.value?.push(response.data);

        toast.add({
          title: "Relation added",
          color: "success",
          description: "Your relation has been added",
          icon: "material-symbols:check-circle",
        });

        showRelationDrawer.value = false;
      })
      .catch((error) => {
        console.log(error);

        toast.add({
          title: "Something went wrong",
          color: "error",
          description: "We couldn't add your relation",
          icon: "material-symbols:error",
        });
      })
      .finally(() => {
        addNewRelationLoading.value = false;
      });
  } else {
    const d = {
      resourceType: selectedRelation.value.resourceType,
      source: selectedRelation.value.source,
      target: selectedRelation.value.target,
      type: selectedRelation.value.type,
    };

    addNewRelationLoading.value = true;

    await $fetch(
      `/api/workspaces/${workspaceid}/collections/${collectionid}/relations/internal`,
      {
        body: JSON.stringify(d),

        method: "POST",
      },
    )
      .then((response) => {
        // Also add the relation to the main relations array
        allRelations.value?.push(response.data);

        toast.add({
          title: "Relation added",
          color: "success",
          description: "Your relation has been added",
          icon: "material-symbols:check-circle",
        });

        showRelationDrawer.value = false;
      })
      .catch((error) => {
        console.error(error);

        toast.add({
          title: "Something went wrong",
          color: "error",
          description: "We couldn't add your relation",
          icon: "material-symbols:error",
        });
      })
      .finally(() => {
        addNewRelationLoading.value = false;
      });
  }
};

const editRelation = async () => {
  if (selectedRelation.value.external) {
    const d = {
      resourceType: selectedRelation.value.resourceType,
      target: selectedRelation.value.target,
      targetType: selectedRelation.value.targetType,
      type: selectedRelation.value.type,
    };

    editRelationLoading.value = true;

    await $fetch(
      `/api/workspaces/${workspaceid}/collections/${collectionid}/relations/external/${selectedRelation.value.id}`,
      {
        body: JSON.stringify(d),

        method: "PUT",
      },
    )
      .then((response) => {
        editRelationLoading.value = false;

        // Also update the relation in the main relations array
        const index =
          allRelations.value?.findIndex(
            (r) => r.id === selectedRelation.value.id,
          ) ?? -1;

        if (index > -1 && allRelations.value) {
          allRelations.value[index] = response.data;
        } else {
          toast.add({
            title: "Something went wrong",
            color: "error",
            description: "We couldn't update your relation",
            icon: "material-symbols:error",
          });
        }

        toast.add({
          title: "Relation updated",
          color: "success",
          description: "Your relation has been updated",
          icon: "material-symbols:check-circle",
        });

        showRelationDrawer.value = false;
      })
      .catch((error) => {
        console.error(error);

        toast.add({
          title: "Something went wrong",
          color: "error",
          description: "We couldn't update your relation",
          icon: "material-symbols:error",
        });
      })
      .finally(() => {
        editRelationLoading.value = false;
      });
  } else {
    const d = {
      resourceType: selectedRelation.value.resourceType,
      target: selectedRelation.value.target,
      type: selectedRelation.value.type,
    };

    editRelationLoading.value = true;

    await $fetch(
      `/api/workspaces/${workspaceid}/collections/${collectionid}/relations/internal/${selectedRelation.value.id}`,
      {
        body: JSON.stringify(d),

        method: "PUT",
      },
    )
      .then((response) => {
        editRelationLoading.value = false;

        // Also update the relation in the main relations array
        const index =
          allRelations.value?.findIndex(
            (r) => r.id === selectedRelation.value.id,
          ) ?? -1;

        if (index > -1 && allRelations.value) {
          allRelations.value[index] = response.data;
        } else {
          toast.add({
            title: "Something went wrong",
            color: "error",
            description: "We couldn't update your relation",
            icon: "material-symbols:error",
          });
        }

        toast.add({
          title: "Relation updated",
          color: "success",
          description: "Your relation has been updated",
          icon: "material-symbols:check-circle",
        });

        showRelationDrawer.value = false;
      })
      .catch((error) => {
        console.error(error);

        toast.add({
          title: "Something went wrong",
          color: "error",
          description: "We couldn't update your relation",
          icon: "material-symbols:error",
        });
      })
      .finally(() => {
        editRelationLoading.value = false;
      });
  }
};

function onSubmit(_event: FormSubmitEvent<any>) {
  if (drawerAction.value === "Add") {
    addNewRelation();
  } else {
    editRelation();
  }
}

function onError(event: FormErrorEvent) {
  if (event?.errors?.[0]?.id) {
    const element = document.getElementById(event.errors[0].id);

    element?.focus();
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

const relationBeingRestored = ref("");

const restoreRelation = async (relationid: string) => {
  const relation = allRelations.value?.find((r) => r.id === relationid);

  if (!relation) {
    toast.add({
      title: "Something went wrong",
      color: "error",
      description: "We couldn't load your relation",
      icon: "material-symbols:error",
    });

    return;
  }

  relationBeingRestored.value = relationid;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/relations/${relation.external ? "external" : "internal"}/${relationid}`,
    {
      method: "PATCH",
    },
  )
    .then((response) => {
      relation.action = response.updatedAction;

      toast.add({
        title: "Relation restored",
        color: "success",
        description: "Your relation has been restored",
        icon: "material-symbols:check-circle",
      });
    })
    .catch((error) => {
      console.error(error);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't restore your relation",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      relationBeingRestored.value = "";
    });
};

const selectRelationResourceType = (resourceid: string) => {
  if (!targetResourceList.value) {
    getTargetResourceList(resourceid);
  }

  const resource = targetResourceList.value?.find(
    (r: any) => r.value === resourceid,
  );

  if (resource) {
    selectedRelation.value.resourceType = resource.relationResourceType;
  }
};

const mirrorRelationExists = computed(() => {
  if (
    selectedRelation.value.source &&
    selectedRelation.value.target &&
    selectedRelation.value.type &&
    !selectedRelation.value.external
  ) {
    const sourceResource = selectedRelation.value.source;
    const targetResource = selectedRelation.value.target;
    const relation = selectedRelation.value.type;
    const mirrorRelation =
      relationTypeOptions.find((r) => r.value === relation)?.mirror || "";

    if (sourceResource === targetResource) {
      return false;
    }

    if (targetResource in groupedResources.value) {
      const relations = groupedResources.value[targetResource].relations;

      if (mirrorRelation in relations) {
        if (
          relations[mirrorRelation].find((r) => r.source === targetResource)
        ) {
          return true;
        }
      }
    }
  }

  return false;
});

const duplicationRelationExists = computed(() => {
  if (
    selectedRelation.value.source &&
    selectedRelation.value.target &&
    selectedRelation.value.type
  ) {
    const sourceResource = selectedRelation.value.source;
    const targetResource = selectedRelation.value.target;
    const relation = selectedRelation.value.type;

    if (sourceResource === targetResource) {
      return false;
    }

    if (sourceResource in groupedResources.value) {
      const relations = groupedResources.value[sourceResource].relations;

      if (selectedRelation.value.external) {
        if (relation in relations) {
          if (
            relations[relation].find(
              (r) =>
                r.target === targetResource &&
                r.targetType === selectedRelation.value.targetType,
            )
          ) {
            return true;
          }
        }
      } else if (
        relation in relations &&
        relations[relation].find((r) => {
          console.log(r);
          console.log(targetResource);

          return r.target === targetResource;
        })
      ) {
        return true;
      }
    }
  }

  return false;
});

onMounted(() => {
  getTargetResourceList("");
});
</script>

<template>
  <main class="h-full bg-white">
    <div
      class="flex h-36 w-full items-center border-b border-gray-200 bg-white"
    >
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2.5 lg:px-20"
      >
        <div class="flex items-center gap-3">
          <h1 class="text-4xl font-black">Relations</h1>

          <UBadge color="warning" size="lg" variant="soft" icon="mdi:alert">
            Beta
          </UBadge>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            color="primary"
            icon="material-symbols-light:rebase-edit-rounded"
            size="lg"
            @click="openAddRelationDrawer('external')"
          >
            Add an external relation
          </UButton>

          <UButton
            color="primary"
            icon="icon-park-outline:internal-expansion"
            size="lg"
            @click="openAddRelationDrawer('internal')"
          >
            Add an internal relation
          </UButton>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 pb-10 lg:px-20">
      <div v-if="Object.keys(groupedResources).length === 0" class="py-10">
        No relations were found in this collection
      </div>

      <div
        v-else
        size="large"
        class="divide flex w-full flex-col gap-3 divide-y divide-dashed divide-stone-200"
      >
        <!-- <pre>{{ groupedResources }}</pre> -->

        <!-- <pre class="text-xs">{{ targetResourceList }}</pre> -->

        <div
          v-for="(gr1, resourceID, idx) in groupedResources"
          :key="idx"
          class="py-10"
        >
          <div class="flex items-center justify-between">
            <h2
              class="border-b border-dashed border-slate-300 pb-1 pr-4 font-semibold"
            >
              {{ gr1.name }}
            </h2>

            <UDropdownMenu
              :items="
                generateAddRelationFromDropdownOptions(resourceID as string)
              "
              :content="{
                align: 'end',
                side: 'bottom',
                sideOffset: 8,
              }"
              :ui="{
                content: 'w-max',
              }"
            >
              <UButton
                icon="mdi:plus"
                color="primary"
                label="Add a relation to this resource"
              />
            </UDropdownMenu>
          </div>

          <div v-for="(gr, name, index) in gr1.relations" :key="index">
            <div class="flex items-center justify-between pb-1 pt-5">
              <h3>{{ getRelationName(name as string) }}</h3>
            </div>

            <div class="flex w-full flex-col gap-3">
              <div
                v-for="(relation, id) of gr || []"
                :key="id"
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
                <div class="flex w-full flex-col gap-3">
                  <div class="group w-max">
                    <NuxtLink
                      v-if="relation.external && relation.target"
                      :to="
                        relation.targetType !== 'url'
                          ? `https://identifiers.org/${relation.targetType}:${relation.target}`
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
                      {{ relation.targetName }}
                    </div>
                  </div>

                  <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center justify-start gap-4">
                      <UBadge color="info">
                        {{ getResourceTypeName(relation?.resourceType || "") }}
                      </UBadge>

                      <UBadge v-if="relation.targetType" color="success">
                        {{ getResourceIdentifierTypeName(relation.targetType) }}
                      </UBadge>
                    </div>

                    <div
                      v-if="!currentCollection?.version?.published"
                      class="flex items-center gap-4"
                    >
                      <div class="flex">
                        <UBadge
                          v-if="relation.action === 'create'"
                          color="info"
                          icon="mdi:new-box"
                        >
                          New Relation
                        </UBadge>

                        <UBadge
                          v-if="relation.action === 'update'"
                          color="success"
                          icon="mdi:file-document-edit-outline"
                        >
                          Updated
                        </UBadge>

                        <UBadge
                          v-if="relation.action === 'delete'"
                          color="error"
                          icon="mdi:delete-outline"
                        >
                          Marked for deletion
                        </UBadge>
                      </div>

                      <USeparator
                        v-if="relation.action && relation.action !== 'clone'"
                        orientation="vertical"
                        class="h-5"
                      />

                      <UButton
                        v-if="relation.action !== 'delete'"
                        color="info"
                        icon="mdi:file-document-edit-outline"
                        :disabled="relation.action === 'delete'"
                        label="Edit"
                        @click="openEditRelationDrawer(relation.id)"
                      />

                      <UButton
                        v-if="relation.action !== 'delete'"
                        color="error"
                        icon="mdi:delete-outline"
                        :loading="relationBeingDeleted === relation.id"
                        label="Delete"
                        @click="deleteRelation(relation.id)"
                      />

                      <UButton
                        v-if="relation.action === 'delete'"
                        color="warning"
                        icon="mdi:undo"
                        :loading="relationBeingRestored === relation.id"
                        label="Undo delete"
                        @click="restoreRelation(relation.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <USlideover
      v-model:open="showRelationDrawer"
      :title="drawerAction === 'Add' ? 'Add a Relation' : 'Edit Relation'"
      :description="
        selectedRelation.external
          ? 'External relations are created between a resouce in this collection and an outside resource.'
          : 'Internal relations are created between two resources in this collection.'
      "
      class="gap-4"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <UForm
          ref="createForm"
          :validate="validateForm"
          :state="selectedRelation"
          class="gap-4"
          @submit="onSubmit"
          @error="onError"
        >
          <UFormField label="Source" name="source">
            <USelect
              v-model="selectedRelation.source"
              :disabled="
                !!selectedRelation.originalRelationId ||
                sourceResourceListLoadingIndicator ||
                drawerAction === 'Edit'
              "
              :loading="sourceResourceListLoadingIndicator"
              :items="sourceResourceList || []"
              class="w-full"
            />
          </UFormField>

          <USeparator class="my-5" />

          <UFormField
            v-if="selectedRelation.external"
            label="Target"
            name="target"
          >
            <UInput
              v-model="selectedRelation.target as string"
              type="text"
              :disabled="!!selectedRelation.originalRelationId"
              placeholder="10.1234/abc"
              class="w-full"
            />
          </UFormField>

          <UFormField
            v-if="!selectedRelation.external"
            label="Target"
            name="target"
          >
            <USelect
              v-model="selectedRelation.target"
              :disabled="
                !!selectedRelation.originalRelationId ||
                targetResourceListLoadingIndicator ||
                !selectedRelation.source
              "
              :loading="targetResourceListLoadingIndicator"
              :items="generateTargetResourceListOptions()"
              class="w-full"
              @update:value="selectRelationResourceType"
            />
          </UFormField>

          <UFormField
            v-if="selectedRelation.external"
            label="Target Type"
            name="targetType"
          >
            <USelect
              v-model="selectedRelation.targetType as string"
              :items="typeOptions"
              :disabled="!!selectedRelation.originalRelationId"
              placeholder="DOI"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Relation Type" name="type">
            <USelect
              v-model="selectedRelation.type as string"
              :items="relationTypeOptions"
              placeholder="isPartOf"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Resource Type" name="resourceType">
            <USelect
              v-model="selectedRelation.resourceType as string"
              :items="resourceTypeOptions"
              placeholder="Dataset"
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="mirrorRelationExists"
            color="warning"
            title="Warning"
            description="This relation might already exist. We found an inverse relation for this source and target resource. Please check if you want to create a new relation in this instance."
          />

          <UAlert
            v-if="duplicationRelationExists"
            color="warning"
            title="Warning"
            description="This relation might already exist. We found a relation for this source and target resource. Please check if you want to create a new relation in this instance."
          />
        </UForm>
      </template>

      <template #footer>
        <UButton
          color="primary"
          icon="material-symbols:save-sharp"
          size="lg"
          :loading="addNewRelationLoading || editRelationLoading"
          :disabled="duplicationRelationExists"
          type="submit"
          label="Save relation"
          @click="createForm?.submit()"
        >
          Save relation
        </UButton>
      </template>
    </USlideover>
  </main>
</template>
