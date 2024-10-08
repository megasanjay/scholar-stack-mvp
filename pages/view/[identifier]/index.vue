<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import dayjs from "dayjs";
import RESOURCE_TYPE_JSON from "@/assets/json/resource-type.json";
import COLLECTION_TYPE_JSON from "@/assets/json/collection-type.json";

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
const collectionTypeOptions = COLLECTION_TYPE_JSON;

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

const selectCollectionType = (type: string) => {
  const collectionType = collectionTypeOptions.find(
    (collectionType) => collectionType.value === type,
  );

  if (collectionType) {
    return collectionType;
  }

  return {
    icon: "mdi:file-question",
    label: "Unknown",
    value: "unknown",
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

const copyToClipboard = (input: string) => {
  console.log("Copying to clipboard", input);
  const source = input;

  const { copied, copy, isSupported } = useClipboard({ source });

  if (!isSupported) {
    push.error("The Clipboard API is not supported by your browser");
  }

  copy(source);

  if (copied) {
    push.success("Your URL was copied to the clipboard");
  }
};
</script>

<template>
  <main class="relative w-full grow overflow-auto px-2 py-10 sm:px-6">
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

      <div class="flex items-center justify-between pl-5 pr-5">
        <n-flex align="center">
          <n-tag type="success" :bordered="false">
            Version {{ data?.name || "N/A" }}
          </n-tag>

          <n-tag type="info" :bordered="false">
            {{ dayjs(data?.published_on).format("MMMM DD, YYYY") || "N/A" }}
          </n-tag>

          <n-tag
            :color="{
              color: '#3498db',
              textColor: '#ffffff',
              borderColor: '#2980b9',
            }"
            :bordered="false"
          >
            <template #icon>
              <Icon
                :name="selectCollectionType(data?.collection.type || '').icon"
                size="18"
              />
            </template>
            {{ selectCollectionType(data?.collection.type || "").label }}
          </n-tag>
        </n-flex>

        <n-popover trigger="hover" :disabled="!!loggedIn">
          <template #trigger>
            <n-button
              class="dark:text-white"
              :loading="starLoading"
              @click="
                loggedIn
                  ? starredStatus
                    ? removeCollectionStar()
                    : starCollection()
                  : null
              "
            >
              <template #icon>
                <Icon
                  name="ic:round-star"
                  size="18"
                  :class="{
                    'text-yellow-400': starredStatus,
                  }"
                />
              </template>

              <div class="flex items-center">
                <span>
                  {{ starredStatus ? "Starred" : "Star" }}
                </span>

                <div>
                  <n-divider vertical />
                </div>

                <span class="pl-1"> {{ starCount }} </span>
              </div>
            </n-button>
          </template>

          <span> You must be logged in to star this collection. </span>
        </n-popover>
      </div>

      <div class="gap-10 px-2 pt-2 md:grid md:grid-cols-12 md:px-5 md:pt-5">
        <div class="col-span-9">
          <n-flex vertical>
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

            <MarkdownRender
              v-if="data?.collection.detailed_description"
              :content="data?.collection.detailed_description"
            />

            <p v-else>
              {{ data?.collection.description || "No description provided." }}
            </p>

            <n-divider />

            <n-flex vertical>
              <p class="mb-2 w-max border-b pr-3 text-lg font-bold">
                Links to this collection
              </p>

              <n-flex align="center">
                <div class="flex items-center space-x-2">
                  <Icon name="simple-icons:doi" size="25" />

                  <NuxtLink
                    :to="`https://doi.org/10.5281/${data?.collection.identifier}`"
                    target="_blank"
                    class="text-base font-bold text-blue-600 transition-all hover:text-blue-700 hover:underline"
                  >
                    10.5281/{{ data?.collection.identifier }}
                  </NuxtLink>
                </div>

                <n-button
                  strong
                  circle
                  class="dark:text-white"
                  size="small"
                  @click="
                    copyToClipboard(
                      `https://doi.org/${data?.collection.identifier}`,
                    )
                  "
                >
                  <template #icon>
                    <Icon name="solar:copy-bold" size="15" />
                  </template>
                </n-button>

                <n-button strong circle class="dark:text-white" size="small">
                  <template #icon>
                    <Icon name="fluent:qr-code-20-regular" size="15" />
                  </template>
                </n-button>
              </n-flex>

              <n-flex align="center">
                <div class="flex items-center space-x-2">
                  <Icon name="ph:link-bold" size="25" />

                  <NuxtLink
                    :to="`https://sciconnect.io/view/${data?.collection.identifier}`"
                    target="_blank"
                    class="text-base font-bold text-blue-600 transition-all hover:text-blue-700 hover:underline"
                  >
                    https://sciconnect.io/view/{{ data?.collection.identifier }}
                  </NuxtLink>
                </div>

                <n-button
                  strong
                  circle
                  class="dark:text-white"
                  size="small"
                  @click="
                    copyToClipboard(
                      `https://sciconnect.io/view/${data?.collection.identifier}`,
                    )
                  "
                >
                  <template #icon>
                    <Icon name="solar:copy-bold" size="15" />
                  </template>
                </n-button>
              </n-flex>
            </n-flex>
          </n-flex>
        </div>

        <div class="relative col-span-3 pt-4">
          <NuxtImg
            :src="`${data?.collection.image_url}?t=${data?.collection.updated}`"
            :alt="data?.collection.title"
            class="h-auto w-full rounded-lg"
          />
        </div>
      </div>

      <n-divider />

      <n-tabs
        type="line"
        animated
        default-value="resources"
        class="px-3 md:px-7"
      >
        <n-tab-pane name="resources" tab="Resources">
          <template #tab>
            <n-flex align="center" class="px-2">
              <Icon name="fluent:text-bullet-list-square-16-filled" size="18" />

              <span class="font-medium"> Resources</span>
            </n-flex>
          </template>

          <n-flex vertical>
            <div
              v-for="(group, name, index) in groupedResources"
              :key="index"
              class="py-10"
            >
              <div class="flex items-center justify-between pb-5">
                <n-flex align="center">
                  <Icon :name="selectIcon(name as string).icon" size="35" />

                  <h2>
                    {{ selectIcon(name as string).name }}
                    <span> ({{ group.length }}) </span>
                  </h2>
                </n-flex>
              </div>

              <n-flex vertical class="w-full">
                <div
                  v-for="(resource, idx) of group || []"
                  :key="idx"
                  class="flex w-full flex-grow flex-col rounded-md border border-stone-200 bg-white px-6 pt-4 shadow-sm dark:bg-stone-800"
                >
                  <div class="flex w-full items-center justify-start pb-2">
                    <h3 class="text-lg font-semibold">
                      {{ resource.title || "No title provided" }}
                    </h3>
                  </div>

                  <p class="border-t border-dashed py-3 font-normal">
                    {{ resource.description || "No description provided" }}
                  </p>

                  <n-flex
                    align="center"
                    justify="space-between"
                    class="pb-4 pt-2"
                  >
                    <n-flex align="center">
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
                    </n-flex>

                    <DiscoverResourceMetrics
                      :resource-type="resource.resource_type"
                    />
                  </n-flex>
                </div>
              </n-flex>
            </div>
          </n-flex>
        </n-tab-pane>

        <n-tab-pane
          name="relations"
          tab="Relations"
          display-directive="show:lazy"
        >
          <template #tab>
            <n-flex align="center" class="px-2">
              <Icon name="tabler:circles-relation" size="18" />

              <span class="font-medium"> Relations</span>
            </n-flex>
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
            :resources="(data?.Resources as unknown as ResourceType[]) || []"
          />
        </n-tab-pane>

        <n-tab-pane
          name="changelog"
          tab="Changelog"
          display-directive="show:lazy"
        >
          <template #tab>
            <n-flex align="center" class="px-2">
              <Icon name="fluent:history-24-filled" size="18" />

              <span class="font-medium"> Changelog</span>
            </n-flex>
          </template>

          <MarkdownRender :content="data?.changelog" />
        </n-tab-pane>

        <n-tab-pane name="versions" tab="Versions">
          <template #tab>
            <n-flex align="center" class="px-2">
              <Icon name="mingcute:version-fill" size="18" />

              <span class="font-medium"> Versions </span>
            </n-flex>
          </template>

          <DiscoverVersionSelector
            :selected-version-identifier="selectedVersionIdentifier || ''"
            :versions="(data?.Versions as Version[]) || []"
            :collection-identifier="data?.collection.identifier || ''"
          />
        </n-tab-pane>

        <n-tab-pane name="analytics" tab="Analytics">
          <template #tab>
            <n-flex align="center" class="px-2">
              <Icon name="bi:bar-chart-fill" size="18" />

              <span class="font-medium"> Analytics</span>
            </n-flex>
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

        <n-tab-pane name="impact" tab="Impact">
          <template #tab>
            <n-flex align="center" class="px-2">
              <Icon name="ph:list-heart" size="18" />

              <span class="font-medium"> Impact</span>
            </n-flex>
          </template>

          <DiscoverImpactCloud />
        </n-tab-pane>
      </n-tabs>
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
