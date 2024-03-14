<script setup lang="ts">
import RESOURCE_TYPE_JSON from "@/assets/json/resource-type.json";

definePageMeta({
  layout: "public",
});

const route = useRoute();

const resourceTypeOptions = RESOURCE_TYPE_JSON;

const { identifier } = route.params as { identifier: string };

const { data, error } = await useFetch(
  `/api/discover/collections/${identifier}`,
  {
    headers: useRequestHeaders(["cookie"]),
  },
);

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
  });
}

const selectIcon = (type: string) => {
  const resourceType = resourceTypeOptions.find(
    (resourceType) => resourceType.value === type,
  );

  if (resourceType) {
    return {
      name: resourceType.label,
      icon: resourceType.icon,
    };
  }

  return {
    name: "Unknown",
    icon: "mdi:file-question",
  };
};

const groupedResources = computed(() => {
  const resources = data.value?.Resources || [];
  const grouped: { [key: string]: any[] } = {};

  for (const resource of resources) {
    if (resource.resource_type) {
      if (resource.resource_type in grouped) {
        grouped[resource.resource_type].push(resource);
      } else {
        grouped[resource.resource_type] = [resource];
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
    sortedGrouped[key] = grouped[key];
  }

  return sortedGrouped;
});

const selectedVersionIdentifier = computed(() => {
  // Get the first character of the identifier
  const type = identifier[0];

  if (type === "c") {
    // Select the latest version of the collection
    return data.value?.Versions[0].identifier;
  }

  return identifier;
});
</script>

<template>
  <main class="h-screen w-full grow overflow-auto bg-white px-6 pb-10 pt-5">
    <div class="relative mx-auto max-w-screen-xl">
      <div class="grid grid-cols-12">
        <n-space vertical class="col-span-9 mt-5">
          <n-space align="center">
            <h1 class="mb-2">
              {{ data?.collection.title || "Collection Title Unavailable" }}
            </h1>

            <n-tag type="success" :bordered="false">
              Version {{ data?.name || "N/A" }}
            </n-tag>
          </n-space>

          <ul class="mb-1 flex list-none">
            <li
              v-for="creator in data?.creators || []"
              :key="creator.creatorIndex"
            >
              <n-popover trigger="hover" placement="bottom">
                <template #trigger>
                  <span
                    class="cursor-help rounded-md p-[2px] text-sm transition-all hover:bg-orange-200/50"
                    >{{ creator.creatorName }};</span
                  >
                </template>

                <span>
                  {{ creator.affiliation || "No affiliation provided." }}
                </span>
              </n-popover>
            </li>
          </ul>

          <p class="line-clamp-5">
            {{ data?.collection.description || "No description provided." }}
          </p>

          <p class="text-base">
            Published on
            {{
              data?.published_on
                ? displayStandardDate(data.published_on as string)
                : "Unknown"
            }}
          </p>
        </n-space>

        <NuxtImg
          :src="data?.collection.image"
          :alt="data?.collection.title"
          class="col-span-3 h-auto max-h-60 w-full"
        />
      </div>

      <n-divider />

      <n-tabs type="segment" animated default-value="resources">
        <n-tab-pane name="resources" tab="Resources">
          <template #tab>
            <n-space align="center">
              <Icon name="fluent:text-bullet-list-square-16-filled" size="18" />

              <span class="font-medium"> Resources</span>
            </n-space>
          </template>

          <div class="flex flex-col divide-y">
            <div
              v-for="(group, name, index) in groupedResources"
              :key="index"
              class="py-10"
            >
              <div class="flex items-center justify-between pb-5">
                <n-space align="center">
                  <Icon :name="selectIcon(name as string).icon" size="35" />

                  <h2>{{ selectIcon(name as string).name }}</h2>
                </n-space>
              </div>

              <n-space vertical size="large" class="w-full">
                <div
                  v-for="(resource, idx) of group || []"
                  :key="idx"
                  class="flex w-full flex-grow flex-col rounded-md border px-6 pt-6 shadow-sm"
                >
                  <div class="flex w-full items-center justify-start pb-2">
                    <span class="text-lg font-medium leading-5">
                      {{ resource.title || "No title provided" }}
                    </span>
                  </div>

                  <p class="border-t border-dashed py-3">
                    {{ resource.description || "No description provided" }}
                  </p>

                  <div
                    class="flex w-full items-center space-x-1 border-t pb-4 pt-3"
                  >
                    <n-tag
                      :type="resource.identifier_type ? 'info' : 'error'"
                      size="small"
                      class=""
                    >
                      {{ resource.identifier_type || "No identifier provided" }}
                    </n-tag>

                    <div>
                      <n-divider vertical />
                    </div>

                    <div class="group w-max">
                      <NuxtLink
                        :to="
                          resource.identifier_type !== 'url'
                            ? `https://identifiers.org/${resource.identifier_type}/${resource.identifier}`
                            : resource.identifier
                        "
                        class="flex items-center font-medium text-blue-600 transition-all group-hover:text-blue-700 group-hover:underline"
                        target="_blank"
                        @click.stop=""
                      >
                        {{ resource.identifier }}

                        <Icon
                          v-if="resource.identifier_type"
                          name="mdi:external-link"
                          size="16"
                          class="ml-1 text-blue-600 transition-all group-hover:text-blue-700 group-hover:underline"
                        />
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </n-space>
            </div>
          </div>
        </n-tab-pane>

        <n-tab-pane name="relations" tab="Relations">
          <template #tab>
            <n-space align="center">
              <Icon name="tabler:circles-relation" size="18" />

              <span class="font-medium"> Relations</span>
            </n-space>
          </template>

          <FlowRelationsGraph
            :relations="{
              internal:
                (data?.InternalRelations as unknown as CatalogInternalRelation[]) ||
                [],
              external:
                (data?.ExternalRelations as unknown as CatalogExternalRelation[]) ||
                [],
            }"
            :resources="(data?.Resources as unknown as ResourceType[]) || []"
          />
        </n-tab-pane>

        <n-tab-pane name="versions" tab="Versions">
          <template #tab>
            <n-space align="center">
              <Icon name="system-uicons:versions" size="18" />

              <span class="font-medium"> Versions</span>
            </n-space>
          </template>

          <n-space vertical>
            <n-alert type="info" show-icon>
              <p>
                The latest version of this collection is
                <strong>{{ data?.Versions[0].name }}</strong>
                . If you want to always link to the latest version, use the
                <NuxtLink
                  :to="`/view/${data?.collection.identifier}`"
                  class="text-sky-500 transition-all hover:text-sky-400"
                >
                  {{ data?.collection.identifier }}</NuxtLink
                >
                identifier.
              </p>
            </n-alert>

            <n-table :bordered="false" :single-line="false">
              <thead>
                <tr>
                  <th>Name</th>

                  <th>Identifier</th>

                  <th>Published on</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="version in data?.Versions" :key="version.id">
                  <td
                    :class="{
                      '!bg-emerald-50':
                        version.identifier === selectedVersionIdentifier,
                    }"
                  >
                    {{ version.name }}
                  </td>

                  <td
                    :class="{
                      '!bg-emerald-50':
                        version.identifier === selectedVersionIdentifier,
                    }"
                  >
                    <NuxtLink
                      :to="`/view/${version.identifier}`"
                      class="text-sky-500 transition-all hover:text-sky-400"
                    >
                      {{ version.identifier }}
                    </NuxtLink>
                  </td>

                  <td
                    :class="{
                      '!bg-emerald-50':
                        version.identifier === selectedVersionIdentifier,
                    }"
                  >
                    {{ displayStandardDate(version.published_on as string) }}
                  </td>
                </tr>
              </tbody>
            </n-table>
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </div>

    <n-back-top />
  </main>
</template>
