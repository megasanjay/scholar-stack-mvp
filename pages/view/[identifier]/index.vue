<script setup lang="ts">
import sanitizeHtml from "sanitize-html";
import { parse } from "marked";
import dayjs from "dayjs";
import RESOURCE_TYPE_JSON from "@/assets/json/resource-type.json";

definePageMeta({
  layout: "public",
});

const route = useRoute();

const resourceTypeOptions = RESOURCE_TYPE_JSON;

const markdownToHtml = ref("");

const sanitize = (html: string) => sanitizeHtml(html);

const convertMarkdownToHtml = async (
  markdown: string = "No content provided",
) => {
  return sanitize(await parse(markdown));
};

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

if (data.value) {
  markdownToHtml.value = await convertMarkdownToHtml(
    data.value.collection.detailed_description || "",
  );
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
  <main class="w-full grow overflow-auto px-6 pb-10 pt-5">
    <div
      class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      aria-hidden="true"
    >
      <div
        class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-red-100 to-orange-200 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        style="
          clip-path: polygon(
            74.1% 44.1%,
            100% 61.6%,
            97.5% 26.9%,
            85.5% 0.1%,
            80.7% 2%,
            72.5% 32.5%,
            60.2% 62.4%,
            52.4% 68.1%,
            47.5% 58.3%,
            45.2% 34.5%,
            27.5% 76.7%,
            0.1% 64.9%,
            17.9% 100%,
            27.6% 76.8%,
            76.1% 97.7%,
            74.1% 44.1%
          );
        "
      />
    </div>

    <div class="relative mx-auto max-w-screen-2xl">
      <div class="grid grid-cols-12">
        <n-space vertical class="col-span-9 mt-5">
          <n-space align="start" vertical>
            <n-flex justify="space-between" align="center">
              <n-tag type="success" :bordered="false">
                Version {{ data?.name || "N/A" }}
              </n-tag>

              <n-tag type="info" :bordered="false">
                {{ dayjs(data?.published_on).format("MMMM DD, YYYY") || "N/A" }}
              </n-tag>
            </n-flex>

            <h1 class="mb-2">
              {{ data?.collection.title || "Collection Title Unavailable" }}
            </h1>
          </n-space>

          <ul class="mb-1 flex list-none">
            <li
              v-for="creator in (data?.creators as unknown as CollectionCreators) ||
              []"
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

          <!-- eslint-disable vue/no-v-html -->
          <div
            v-if="data?.collection.detailed_description"
            class="prose max-w-none border-t pt-2"
            v-html="markdownToHtml"
          />
          <!-- eslint-enable vue/no-v-html -->

          <p v-else>
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

          <div class="flex flex-col">
            <div
              v-for="(group, name, index) in groupedResources"
              :key="index"
              class="py-10"
            >
              <div class="flex items-center justify-between pb-5">
                <n-space align="center">
                  <Icon :name="selectIcon(name as string).icon" size="35" />

                  <h2>
                    {{ selectIcon(name as string).name }}
                    <span> ({{ group.length }}) </span>
                  </h2>
                </n-space>
              </div>

              <n-space vertical class="w-full">
                <div
                  v-for="(resource, idx) of group || []"
                  :key="idx"
                  class="flex w-full flex-grow flex-col rounded-md border border-slate-200 bg-white px-6 pt-4"
                >
                  <div class="flex w-full items-center justify-start pb-2">
                    <span class="text-lg font-medium">
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
            class="backdrop-blur-xl backdrop-grayscale"
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
            <n-alert type="info" show-icon class="mb-3">
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

            <n-table :bordered="true" :single-line="false" class="bg-white">
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
