<script setup lang="ts">
import RESOURCE_TYPE_JSON from "@/assets/json/resource-type.json";

definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const toast = useToast();
const route = useRoute();

const resourceTypeOptions = RESOURCE_TYPE_JSON;

const selectedView = ref("list");
const selectedSort = ref("activity");

const { collectionid, workspaceid } = route.params as {
  collectionid: string;
  workspaceid: string;
};

const { data: collection, error } = await useFetch<CollectionGETAPIResponse>(
  `/api/workspaces/${workspaceid}/collections/${collectionid}`,
  {},
);

if (error.value) {
  console.log(error.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    description: "We couldn't load your collectionss",
    icon: "material-symbols:error",
  });

  navigateTo(`/dashboard/workspaces/${workspaceid}`);
}

const sortedResources = computed(() => {
  const resources = collection.value?.resources || [];

  if (selectedSort.value === "activity") {
    return resources.sort((a, b) => {
      const aDate = new Date(a.updated);
      const bDate = new Date(b.updated);

      if (aDate > bDate) {
        return -1;
      }

      if (aDate < bDate) {
        return 1;
      }

      return 0;
    });
  }

  if (selectedSort.value === "name") {
    return resources.sort((a, b) => {
      if (a.title.toLowerCase() < b.title.toLowerCase()) {
        return -1;
      }

      if (a.title.toLowerCase() > b.title.toLowerCase()) {
        return 1;
      }

      return 0;
    });
  }
});

const groupedResources = computed(() => {
  const resources = collection.value?.resources || [];
  const grouped: { [key: string]: any[] } = {};

  for (const resource of resources) {
    if (resource.resourceType) {
      if (resource.resourceType in grouped) {
        grouped[resource.resourceType]?.push(resource);
      } else {
        grouped[resource.resourceType] = [resource];
      }
    }
  }

  Object.keys(grouped).forEach((key) => {
    const group = grouped[key];

    if (group) {
      group.sort((a, b) => {
        if (a.title.toLowerCase() < b.title.toLowerCase()) {
          return -1;
        }

        if (a.title.toLowerCase() > b.title.toLowerCase()) {
          return 1;
        }

        return 0;
      });
    }
  });

  // Sort the keys
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a.toLowerCase() < b.toLowerCase()) {
      return -1;
    }

    if (a.toLowerCase() > b.toLowerCase()) {
      return 1;
    }

    return 0;
  });

  const sortedGrouped: { [key: string]: any[] } = {};

  for (const key of sortedKeys) {
    sortedGrouped[key] = grouped[key] || [];
  }

  return sortedGrouped;
});

const { collectionPermissionAbility, collectionPermissionGetLoading } =
  await useCollectionPermission(workspaceid, collectionid);

const selectIcon = (type: string) => {
  return selectResourceType(type).icon;
};

const selectResourceType = (type: string) => {
  return (
    resourceTypeOptions.find((resourceType) => resourceType.value === type) || {
      icon: "mdi:file-question",
      label: "Unknown",
      value: "unknown",
    }
  );
};
</script>

<template>
  <UContainer>
    <UPage>
      <UPageHeader title="Resources"> </UPageHeader>

      <UPageBody>
        <div>
          <div class="flex items-center justify-between gap-4 pb-10">
            <UInput
              placeholder="Search..."
              icon="iconamoon:search-duotone"
              size="lg"
              type="search"
            />

            <USelect
              v-if="selectedView === 'list'"
              v-model="selectedSort"
              size="lg"
              :items="[
                {
                  label: 'Sort by activity',
                  value: 'activity',
                },
                {
                  label: 'Sort by name',
                  value: 'name',
                },
              ]"
            />

            <div class="flex items-center">
              <UButton
                color="neutral"
                :variant="selectedView === 'list' ? 'subtle' : 'outline'"
                icon="fa-solid:list"
                @click="selectedView = 'list'"
              />
              <UButton
                color="neutral"
                :variant="selectedView === 'grouped' ? 'subtle' : 'outline'"
                icon="fluent:group-list-24-filled"
                @click="selectedView = 'grouped'"
              />
            </div>

            <UButton
              color="primary"
              icon="mdi:plus"
              size="lg"
              :disabled="
                !collection?.version ||
                collection?.version?.published ||
                !collectionPermissionAbility.includes('edit') ||
                collectionPermissionGetLoading
              "
              :to="`/dashboard/workspaces/${workspaceid}/collections/${collection?.id}/resources/new`"
            >
              <span class="w-max"> Add a new resource </span>
            </UButton>
          </div>

          <div
            v-if="
              collection?.version === null ||
              collection?.resources?.length === 0
            "
            class="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8"
          >
            <UIcon name="mingcute:empty-box-line" size="48" />

            <p class="text-center text-lg font-medium">No resources found</p>

            <p class="text-center text-sm text-slate-500">
              You can add a new resource by clicking the button above.
            </p>
          </div>

          <div
            v-if="
              collection?.version &&
              collection?.resources &&
              selectedView === 'list'
            "
            class="flex flex-col gap-4"
          >
            <ResourceCard
              v-for="resource in sortedResources"
              :key="resource.id"
              :resource="resource"
              :workspaceid="workspaceid"
              :collectionid="collectionid"
              :collection="collection"
            />
          </div>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
