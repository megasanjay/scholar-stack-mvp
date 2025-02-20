<script setup lang="ts">
import RESOURCE_TYPE_JSON from "@/assets/json/resource-type.json";

definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const toast = useToast();
const route = useRoute();

const resourceTypeOptions = RESOURCE_TYPE_JSON;

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

const { collectionPermissionAbility, collectionPermissionGetLoading } =
  await useCollectionPermission(workspaceid, collectionid);

const selectIcon = (type: string) => {
  const resourceType = resourceTypeOptions.find(
    (resourceType) => resourceType.value === type,
  );

  if (resourceType) {
    return resourceType.icon;
  }

  return "mdi:file-question";
};
</script>

<template>
  <main class="h-screen overflow-auto bg-zinc-50">
    <div class="flex h-36 items-center border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-screen-xl items-center justify-between px-2 lg:px-20"
      >
        <div class="flex items-center space-x-2">
          <h1 class="text-4xl font-black">Resources</h1>
        </div>
      </div>
    </div>

    <div class="mx-auto w-full max-w-screen-xl px-2.5 pb-10 lg:px-20">
      <div class="flex items-center justify-between gap-4 py-10">
        <UInput
          placeholder="Search..."
          icon="iconamoon:search-duotone"
          size="lg"
          type="search"
        />

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
        v-if="collection?.version === null"
        class="rounded-lg border border-dashed px-4 py-8"
      >
        No resources found
      </div>

      <div
        v-if="collection?.version && collection?.resources"
        class="flex flex-col gap-4"
      >
        <NuxtLink
          v-for="resource in collection?.resources"
          :key="resource.id"
          :to="
            resource.action === 'delete' || resource.action === 'oldVersion'
              ? ''
              : `/dashboard/workspaces/${workspaceid}/collections/${collection?.id}/resources/${resource.id}`
          "
          class="flex w-full flex-grow flex-col rounded-md border px-6 pt-6 shadow-sm transition-all hover:shadow-md"
          :class="{
            'cursor-not-allowed border-red-300 bg-red-50 !shadow-none':
              resource.action === 'delete' || resource.action === 'oldVersion',
            'border-slate-300 bg-white':
              !resource.action || resource.action === 'clone',
            'border-blue-300 bg-cyan-50/20': resource.action === 'create',
            'border-emerald-400 bg-emerald-50/20': resource.action === 'update',
            'border-cyan-400 bg-cyan-50/20': resource.action === 'newVersion',
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

                <div class="flex items-center justify-end space-x-2">
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
                        resource.action === 'delete' ||
                        resource.action === 'oldVersion'
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
                        v-if="
                          resource.action === 'delete' ||
                          resource.action === 'oldVersion'
                        "
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

                  <UBadge
                    v-if="resource.action === 'oldVersion'"
                    color="warning"
                    size="md"
                    variant="outline"
                    icon="ic:round-history"
                  >
                    Newer Version Available
                  </UBadge>

                  <UBadge
                    v-if="resource.action === 'newVersion'"
                    color="info"
                    size="md"
                    variant="outline"
                    icon="clarity:new-solid"
                  >
                    New Version
                  </UBadge>

                  <USeparator
                    v-if="resource.action && resource.action !== 'oldVersion'"
                    orientation="vertical"
                  />

                  <UButton
                    v-if="resource.action === 'delete'"
                    size="sm"
                    color="error"
                    icon="mdi:undo"
                  >
                    Undo delete
                  </UButton>

                  <NuxtLink
                    v-if="
                      resource.action !== 'delete' &&
                      resource.action !== 'oldVersion' &&
                      !collection?.version?.published
                    "
                    :to="`/dashboard/workspaces/${workspaceid}/collections/${collection?.id}/resources/${resource.id}/edit`"
                  >
                    <UButton size="sm" icon="akar-icons:edit" color="primary">
                      Edit
                    </UButton>
                  </NuxtLink>
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

            <div class="group w-max">
              <ULink
                :to="
                  resource.identifierType !== 'url'
                    ? `https://identifiers.org/${resource.identifierType}/${resource.identifier}`
                    : resource.identifier
                "
                class="flex items-center font-medium text-blue-600 transition-all group-hover:text-blue-700 group-hover:underline"
                target="_blank"
                @click.stop=""
              >
                {{ resource.identifier }}

                <Icon
                  v-if="resource.identifierType"
                  name="mdi:external-link"
                  size="16"
                  class="ml-1 text-blue-600 transition-all group-hover:text-blue-700 group-hover:underline"
                />
              </ULink>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <ModalNewCollection />
  </main>
</template>
