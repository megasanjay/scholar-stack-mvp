<script setup lang="ts">
import sanitizeHtml from "sanitize-html";
import { parse } from "marked";
import dayjs from "dayjs";
import RESOURCE_TYPE_JSON from "@/assets/json/resource-type.json";

definePageMeta({
  layout: "public",
});

const route = useRoute();
const user = useSupabaseUser();

const loggedIn = computed(() => user.value);

const starLoading = ref(false);
const starredStatus = ref(false);
const starCount = ref(0);

const resourceTypeOptions = RESOURCE_TYPE_JSON;

const detailedDescription = ref("");
const changeLog = ref("");

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
  detailedDescription.value = await convertMarkdownToHtml(
    data.value.collection.detailed_description || "",
  );

  changeLog.value = await convertMarkdownToHtml(data.value.changelog || "");
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

const { data: starStatusData, error: starStatusError } = await useFetch(
  `/api/discover/collections/${data.value?.collection.identifier}/star`,
  {
    headers: useRequestHeaders(["cookie"]),
  },
);

if (starStatusError.value) {
  console.error(starStatusError.value);
}

if (starStatusData.value) {
  console.log(starStatusData.value);

  starredStatus.value = starStatusData.value.starred;
  starCount.value = starStatusData.value.starCount;
}

const starCollection = async () => {
  starLoading.value = true;

  await $fetch(
    `/api/discover/collections/${data.value?.collection.identifier}/star`,
    {
      headers: useRequestHeaders(["cookie"]),
      method: "POST",
    },
  )
    .then(() => {
      push.success({
        title: "Collection starred",
      });

      starredStatus.value = true;
      starCount.value += 1;
    })
    .catch((error) => {
      console.error(error);

      push.error({
        title: "Something went wrong",
      });
    })
    .finally(() => {
      starLoading.value = false;
    });
};

const removeCollectionStar = async () => {
  starLoading.value = true;

  await $fetch(
    `/api/discover/collections/${data.value?.collection.identifier}/star`,
    {
      headers: useRequestHeaders(["cookie"]),
      method: "DELETE",
    },
  )
    .then(() => {
      push.success({
        title: "Collection unstarred",
      });

      starredStatus.value = false;
      starCount.value -= 1;
    })
    .catch((error) => {
      console.error(error);

      push.error({
        title: "Something went wrong",
      });
    })
    .finally(() => {
      starLoading.value = false;
    });
};
</script>

<template>
  <main class="relative w-full grow overflow-auto px-6 pb-10 pt-5">
    <div class="relative mx-auto max-w-screen-2xl">
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

      <div class="grid grid-cols-12 gap-10 px-5">
        <div class="col-span-8">
          <n-space vertical class="mt-5">
            <div class="flex items-center justify-between">
              <n-flex align="center">
                <n-tag type="success" :bordered="false">
                  Version {{ data?.name || "N/A" }}
                </n-tag>

                <n-tag type="info" :bordered="false">
                  {{
                    dayjs(data?.published_on).format("MMMM DD, YYYY") || "N/A"
                  }}
                </n-tag>
              </n-flex>

              <n-popover trigger="hover" :disabled="!!loggedIn">
                <template #trigger>
                  <n-button
                    color="black"
                    :disabled="!loggedIn"
                    :loading="starLoading"
                    @click="
                      starredStatus ? removeCollectionStar() : starCollection()
                    "
                  >
                    <template #icon>
                      <Icon
                        name="bi:star"
                        size="18"
                        :class="{
                          'text-yellow-400': starredStatus,
                        }"
                      />
                    </template>

                    <div class="flex items-center gap-1 divide-x pl-1">
                      <span>
                        {{ starredStatus ? "Starred" : "Star" }}
                      </span>

                      <span class="pl-1"> {{ starCount }} </span>
                    </div>
                  </n-button>
                </template>

                <span> You must be logged in to star this collection. </span>
              </n-popover>
            </div>

            <h1 class="mb-2">
              {{ data?.collection.title || "Collection Title Unavailable" }}
            </h1>

            <ul
              v-if="
                ((data?.creators as unknown as CollectionCreators) || [])
                  .length > 0
              "
              class="mb-1 flex list-none"
            >
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
              v-html="detailedDescription"
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

          <n-divider />

          <n-tabs type="line" animated default-value="resources">
            <n-tab-pane name="resources" tab="Resources">
              <template #tab>
                <n-space align="center" class="px-2">
                  <Icon
                    name="fluent:text-bullet-list-square-16-filled"
                    size="18"
                  />

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
                          {{
                            resource.identifier_type || "No identifier provided"
                          }}
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

            <n-tab-pane
              name="relations"
              tab="Relations"
              display-directive="show:lazy"
            >
              <template #tab>
                <n-space align="center" class="px-2">
                  <Icon name="tabler:circles-relation" size="18" />

                  <span class="font-medium"> Relations</span>
                </n-space>
              </template>

              <FlowRelationsGraph
                class="vbackdrop-blur-xl vbackdrop-grayscale py-10"
                :relations="{
                  internal:
                    (data?.InternalRelations as unknown as CatalogInternalRelation[]) ||
                    [],
                  external:
                    (data?.ExternalRelations as unknown as CatalogExternalRelation[]) ||
                    [],
                }"
                :resources="
                  (data?.Resources as unknown as ResourceType[]) || []
                "
              />
            </n-tab-pane>

            <n-tab-pane
              name="changelog"
              tab="Changelog"
              display-directive="show:lazy"
            >
              <template #tab>
                <n-space align="center" class="px-2">
                  <Icon name="fluent:history-24-filled" size="18" />

                  <span class="font-medium"> Changelog</span>
                </n-space>
              </template>

              <!-- eslint-disable vue/no-v-html -->
              <div class="prose max-w-none pt-2" v-html="changeLog" />
              <!-- eslint-enable vue/no-v-html -->
            </n-tab-pane>

            <n-tab-pane name="analytics" tab="Analytics">
              <template #tab>
                <n-space align="center" class="px-2">
                  <Icon name="bi:bar-chart-fill" size="18" />

                  <span class="font-medium"> Analytics</span>
                </n-space>
              </template>

              <DiscoverCollectionViewsChart
                class="py-5"
                :collection-identifier="data?.collection.identifier || ''"
              />

              <DiscoverVersionResolutionsChart
                class="py-5"
                :version-identifier="data?.identifier || ''"
              />
            </n-tab-pane>
          </n-tabs>
        </div>

        <div class="relative col-span-4">
          <n-space vertical>
            <NuxtImg
              :src="data?.collection.image_url"
              :alt="data?.collection.title"
              class="h-auto w-full rounded-lg"
            />

            <DiscoverVersionSelector
              :selected-version-identifier="selectedVersionIdentifier || ''"
              :versions="(data?.Versions as Version[]) || []"
              :collection-identifier="data?.collection.identifier || ''"
            />
          </n-space>
        </div>
      </div>
    </div>

    <div
      class="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
      aria-hidden="true"
    >
      <div
        class="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
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
      ></div>
    </div>

    <n-back-top />
  </main>
</template>
