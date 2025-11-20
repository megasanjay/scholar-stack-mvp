<script setup lang="ts">
import RESOURCE_TYPE_JSON from "@/assets/json/resource-type.json";

defineProps({
  collection: {
    default: () => ({}),
    required: false,
    type: Object as PropType<CollectionGETAPIResponse>,
  },
  collectionid: {
    required: true,
    type: String,
  },
  resource: {
    required: true,
    type: Object as PropType<ResourceType>,
  },
  workspaceid: {
    required: true,
    type: String,
  },
});

const resourceTypeOptions = RESOURCE_TYPE_JSON;

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
  <NuxtLink
    :to="
      resource.action === 'delete'
        ? ''
        : `/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources/${resource.id}`
    "
    class="flex w-full flex-grow flex-col rounded-md border px-6 pt-6 shadow-sm transition-all hover:shadow-md"
    :class="{
      'cursor-not-allowed border-red-300 bg-red-50 !shadow-none':
        resource.action === 'delete',
      'border-slate-300 bg-white':
        !resource.action || resource.action === 'clone',
      'border-blue-300 bg-cyan-50/20': resource.action === 'create',
      'border-emerald-400 bg-emerald-50/20': resource.action === 'update',
      'border-red-600 bg-white': resource.filledIn === false,
    }"
  >
    <div class="flex w-full items-center justify-start gap-2 pb-2">
      <UIcon :name="selectIcon(resource.resourceType)" class="size-6" />

      <USeparator orientation="vertical" class="h-5" />

      <div class="flex w-full flex-col gap-1">
        <div class="flex items-center justify-between gap-2">
          <span class="text-lg leading-5 font-medium">
            {{ resource.title || "No title provided" }}
          </span>

          <div class="flex items-center justify-end gap-2">
            <UBadge
              v-if="resource.filledIn === false"
              color="error"
              size="md"
              variant="outline"
              icon="mdi:alert"
            >
              Needs to be filled in
            </UBadge>

            <UTooltip
              :disabled="
                !(
                  resource.action === 'create' ||
                  resource.action === 'update' ||
                  resource.action === 'delete'
                )
              "
            >
              <div class="flex gap-2">
                <UBadge
                  v-if="resource.action === 'create'"
                  type="info"
                  size="md"
                  variant="outline"
                  icon="mdi:new-box"
                >
                  New Resource
                </UBadge>

                <UBadge
                  v-if="resource.action === 'delete'"
                  type="error"
                  size="md"
                  variant="outline"
                  icon="jam:delete"
                >
                  Marked for deletion
                </UBadge>

                <UBadge
                  v-if="resource.action === 'update'"
                  type="success"
                  size="md"
                  variant="outline"
                  icon="clarity:new-solid"
                >
                  Updated
                </UBadge>
              </div>

              <template #content>
                <span>
                  Last modified on {{ displayLongDate(resource.updated) }}
                </span>
              </template>
            </UTooltip>

            <UButton
              v-if="resource.action === 'delete'"
              size="sm"
              color="error"
              icon="mdi:undo"
            >
              Undo delete
            </UButton>

            <USeparator
              v-if="resource.action !== 'clone'"
              orientation="vertical"
              class="h-5"
            />

            <UBadge color="info" variant="outline">
              {{ selectResourceType(resource.resourceType).label || "Unknown" }}
            </UBadge>

            <USeparator
              v-if="resource.versionLabel"
              orientation="vertical"
              class="h-5"
            />

            <UBadge v-if="resource.versionLabel" color="info" variant="soft">
              {{ resource.versionLabel || "No version label" }}
            </UBadge>
          </div>
        </div>
      </div>
    </div>

    <p class="border-t border-dashed border-slate-300 py-3">
      {{ resource.description || "No description provided" }}
    </p>

    <div
      class="flex w-full items-center gap-2 border-t border-slate-400 pt-3 pb-4"
    >
      <UBadge
        :color="resource.identifierType ? 'info' : 'error'"
        size="sm"
        variant="outline"
      >
        {{ resource.identifierType || "No identifier provided" }}
      </UBadge>

      <USeparator orientation="vertical" class="h-5" />

      <div class="flex w-full items-center justify-between gap-8">
        <div class="group w-max">
          <ULink
            :to="
              resource.identifierType !== 'url'
                ? `https://identifiers.org/${resource.identifierType}/${resource.identifier}`
                : resource.identifier
            "
            class="flex items-center gap-1 font-medium text-blue-600 transition-all group-hover:text-blue-700 group-hover:underline"
            target="_blank"
            @click.stop=""
          >
            {{ resource.identifier }}

            <Icon
              v-if="resource.identifierType"
              name="mdi:external-link"
              size="16"
              class="flex items-center text-blue-600 transition-all group-hover:text-blue-700 group-hover:underline"
            />
          </ULink>
        </div>

        <div class="flex items-center gap-2">
          <NuxtLink
            v-if="
              resource.action !== 'delete' && !collection?.version?.published
            "
            :to="`/dashboard/workspaces/${workspaceid}/collections/${collectionid}/resources/${resource.id}/edit`"
          >
            <UButton size="sm" icon="akar-icons:edit" color="primary">
              Edit
            </UButton>
          </NuxtLink>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
