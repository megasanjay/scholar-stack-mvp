<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import dayjs from "dayjs";
import RESOURCE_TYPE_JSON from "@/assets/json/resource-type.json";
import COLLECTION_TYPE_JSON from "@/assets/json/collection-type.json";

const { loggedIn } = useUserSession();

definePageMeta({
  layout: "public",
});

const toast = useToast();
const route = useRoute();

const starLoading = ref(false);
const starredStatus = ref(false);
const starCount = ref(0);

const resourceTypeOptions = RESOURCE_TYPE_JSON;
const collectionTypeOptions = COLLECTION_TYPE_JSON;

const { identifier } = route.params as { identifier: string };

const tabItems = [
  {
    icon: "fluent:text-bullet-list-square-16-filled",
    label: "Resources",
    slot: "resources",
  },
  {
    icon: "tabler:circles-relation",
    label: "Relations",
    slot: "relations",
  },
  {
    icon: "fluent:history-24-filled",
    label: "Changelog",
    slot: "changelog",
  },
  {
    icon: "mingcute:version-fill",
    label: "Versions",
    slot: "versions",
  },
  {
    icon: "bi:bar-chart-fill",
    label: "Analytics",
    slot: "analytics",
  },
  {
    icon: "ph:list-heart",
    label: "Impact",
    slot: "impact",
  },
];

const { data, error } = await useFetch(
  `/api/discover/collections/${identifier}`,
  {},
);

if (error.value) {
  console.log(error.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    description: "We couldn't load the collection",
    icon: "material-symbols:error",
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
  const resources = data.value?.Resource || [];
  const grouped: { [key: string]: any[] } = {};

  for (const resource of resources) {
    if (resource.resourceType) {
      if (resource.resourceType in grouped) {
        grouped[resource.resourceType].push(resource);
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
    sortedGrouped[key] = grouped[key];
  }

  return sortedGrouped;
});

const selectedVersionIdentifier = computed(() => {
  // Get the first character of the identifier
  const type = identifier[0];

  if (type === "c") {
    // Select the latest version of the collection
    return data.value?.Versions[0].id;
  } else {
    return parseInt(identifier.substring(1));
  }
});

const { data: starStatusData, error: starStatusError } = await useFetch(
  `/api/discover/collections/${data.value?.collection.id}/star`,
  {},
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

  await $fetch(`/api/discover/collections/${data.value?.collection.id}/star`, {
    method: "POST",
  })
    .then(() => {
      toast.add({
        title: "Collection starred",
        color: "success",
        description: "This collection has been starred",
        icon: "material-symbols:check-circle",
      });

      starredStatus.value = true;
      starCount.value += 1;
    })
    .catch((error) => {
      console.error(error);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't star this collection",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      starLoading.value = false;
    });
};

const removeCollectionStar = async () => {
  starLoading.value = true;

  await $fetch(`/api/discover/collections/${data.value?.collection.id}/star`, {
    method: "DELETE",
  })
    .then(() => {
      toast.add({
        title: "Collection unstarred",
        color: "success",
        description: "This collection has been unstarred",
        icon: "material-symbols:check-circle",
      });

      starredStatus.value = false;
      starCount.value -= 1;
    })
    .catch((error) => {
      console.error(error);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't unstar this collection",
        icon: "material-symbols:error",
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
    toast.add({
      title: "The Clipboard API is not supported by your browser",
      color: "error",
      description: "Please use a different browser",
      icon: "material-symbols:error",
    });
  }

  copy(source);

  if (copied) {
    toast.add({
      title: "URL copied to clipboard",
      color: "success",
      description: "The URL has been copied to your clipboard",
      icon: "material-symbols:check-circle",
    });
  }
};
</script>

<template>
  <main class="relative w-full grow px-2 py-10 sm:px-6">
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

      <div class="flex items-center justify-between pr-5 pl-5">
        <div class="flex items-center gap-2">
          <UBadge color="success" size="sm" variant="outline">
            Version {{ data?.name || "N/A" }}
          </UBadge>

          <UBadge color="info" size="sm" variant="outline">
            {{ dayjs(data?.publishedOn).format("MMMM DD, YYYY") || "N/A" }}
          </UBadge>

          <UBadge
            color="info"
            size="sm"
            variant="outline"
            :icon="selectCollectionType(data?.collection.type || '').icon"
          >
            {{ selectCollectionType(data?.collection.type || "").label }}
          </UBadge>
        </div>

        <UPopover v-if="!loggedIn" mode="hover">
          <UButton
            label="Open"
            color="neutral"
            variant="subtle"
            :loading="starLoading"
            to="/login"
          >
            <div class="flex items-center gap-2">
              <Icon name="material-symbols:star-rounded" size="20" />

              <span> Star </span>

              <USeparator orientation="vertical" class="h-5" />

              <span class="pl-1"> {{ starCount }} </span>
            </div>
          </UButton>

          <template #content>
            <span class="px-2 py-1">
              You must be logged in to star this collection.
            </span>
          </template>
        </UPopover>

        <UButton
          v-else
          label="Open"
          color="neutral"
          variant="subtle"
          :loading="starLoading"
          @click="
            loggedIn
              ? starredStatus
                ? removeCollectionStar()
                : starCollection()
              : null
          "
        >
          <div class="flex items-center gap-2">
            <Icon
              name="material-symbols:star-rounded"
              size="20"
              :class="{
                'text-yellow-400': starredStatus,
              }"
            />

            <span>
              {{ starredStatus ? "Starred" : "Star" }}
            </span>

            <USeparator orientation="vertical" class="h-5" />

            <span class="pl-1"> {{ starCount }} </span>
          </div>
        </UButton>
      </div>

      <div class="gap-10 px-2 pt-2 md:grid md:grid-cols-12 md:px-5 md:pt-3">
        <div class="col-span-9">
          <div class="flex flex-col gap-3">
            <h1 class="text-4xl font-black">
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
                <UPopover mode="hover">
                  <span
                    class="cursor-help rounded-md p-[2px] text-sm transition-all hover:bg-orange-200/50"
                    >{{ creator.creatorName }};</span
                  >

                  <template #content>
                    <span>
                      {{ creator.affiliation || "No affiliation provided." }}
                    </span>
                  </template>
                </UPopover>
              </li>
            </ul>

            <MarkdownRender
              v-if="data?.collection.detailedDescription"
              :content="data?.collection.detailedDescription"
            />

            <p v-else class="text-lg">
              {{ data?.collection.description || "No description provided." }}
            </p>

            <USeparator class="" />

            <div class="flex flex-col gap-2">
              <p
                class="mb-2 w-max border-b border-gray-200 pr-3 text-lg font-medium"
              >
                Links to this collection
              </p>

              <div class="flex items-center gap-2">
                <div class="flex items-center space-x-2">
                  <Icon name="simple-icons:doi" size="20" />

                  <ULink
                    :to="`https://doi.org/10.5281/c${data?.collection.id}`"
                    target="_blank"
                  >
                    10.5281/c{{ data?.collection.id }}
                  </ULink>
                </div>

                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  icon="solar:copy-bold"
                  @click="
                    copyToClipboard(`https://doi.org/c${data?.collection.id}`)
                  "
                />

                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  icon="fluent:qr-code-20-regular"
                />
              </div>

              <div class="flex items-center gap-2">
                <div class="flex items-center space-x-2">
                  <Icon name="ph:link-bold" size="20" />

                  <ULink
                    :to="`https://sciconnect.io/view/c${data?.collection.id}`"
                    target="_blank"
                  >
                    https://sciconnect.io/view/c{{ data?.collection.id }}
                  </ULink>
                </div>

                <UButton
                  color="neutral"
                  variant="outline"
                  size="xs"
                  icon="solar:copy-bold"
                  @click="
                    copyToClipboard(
                      `https://sciconnect.io/view/c${data?.collection.id}`,
                    )
                  "
                />
              </div>
            </div>
          </div>
        </div>

        <div class="relative col-span-3 pt-4">
          <NuxtImg
            :src="`${data?.collection.imageUrl}?t=${data?.collection.updated}`"
            :alt="data?.collection.title"
            class="h-auto w-full rounded-lg"
          />
        </div>
      </div>

      <USeparator class="my-5" />

      <UTabs
        :items="tabItems"
        orientation="horizontal"
        variant="link"
        class="w-full gap-4"
        :ui="{ trigger: 'cursor-pointer' }"
      >
        <template #resources>
          <div class="flex w-full items-center gap-2">
            <div
              v-for="(group, name, index) in groupedResources"
              :key="index"
              class="w-full py-5"
            >
              <div class="flex items-center justify-between pb-5">
                <div class="flex items-center gap-2">
                  <Icon :name="selectIcon(name as string).icon" size="30" />

                  <h2 class="text-xl font-semibold">
                    {{ selectIcon(name as string).name }}
                    <span> ({{ group.length }}) </span>
                  </h2>
                </div>
              </div>

              <div class="flex w-full flex-col gap-3">
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

                  <div class="flex items-center justify-between pt-2 pb-4">
                    <div class="flex items-center gap-2">
                      <UBadge
                        :color="resource.identifierType ? 'info' : 'error'"
                        size="sm"
                        variant="outline"
                      >
                        {{
                          resource.identifierType || "No identifier provided"
                        }}
                      </UBadge>

                      <USeparator orientation="vertical" class="h-5" />

                      <div class="group w-max">
                        <NuxtLink
                          :to="
                            resource.identifier_type !== 'url'
                              ? `https://identifiers.org/${resource.identifierType}/${resource.identifier}`
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

                    <DiscoverResourceMetrics
                      :resource-type="resource.resourceType"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #relations>
          <FlowRelationsGraph
            class="vbackdrop-blur-xl vbackdrop-grayscale py-10"
            :relations="{
              internal:
                (data?.InternalRelation as unknown as CatalogInternalRelation[]) ||
                [],
              external:
                (data?.ExternalRelation as unknown as CatalogExternalRelation[]) ||
                [],
            }"
            :resources="(data?.Resource as unknown as ResourceType[]) || []"
          />
        </template>

        <template #changelog>
          <MarkdownRender :content="data?.changelog" />
        </template>

        <template #versions>
          <DiscoverVersionSelector
            :selected-version-identifier="selectedVersionIdentifier || 0"
            :versions="(data?.Versions as Version[]) || []"
            :collection-identifier="data?.collection.id || 0"
          />
        </template>

        <template #analytics>
          <DiscoverCollectionViewsChart
            class="py-5"
            :collection-identifier="data?.collection.id || 0"
          />

          <DiscoverVersionResolutionsChart
            class="py-5"
            :version-identifier="data?.id || 0"
          />
        </template>

        <template #impact> <DiscoverImpactCloud /> </template>
      </UTabs>
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
  </main>
</template>
