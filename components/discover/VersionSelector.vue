<script setup lang="ts">
defineProps({
  collectionIdentifier: {
    required: true,
    type: String,
  },
  selectedVersionIdentifier: {
    required: true,
    type: String,
  },
  versions: {
    required: true,
    type: Array as PropType<Version[]>,
  },
});
</script>

<template>
  <div class="my-5 rounded-md border">
    <h3 class="mb-3 mt-4 px-3">Versions</h3>

    <div class="flex max-h-[300px] flex-col divide-y overflow-auto border-y">
      <div
        v-for="version in versions"
        :key="version.id"
        class="px-3 py-3"
        :class="{
          '!bg-purple-50': version.identifier === selectedVersionIdentifier,
        }"
      >
        <n-flex justify="space-between">
          <n-flex vertical size="small">
            <NuxtLink
              :to="`/view/${version.identifier}`"
              class="text-base text-sky-500 transition-all hover:text-sky-400"
            >
              Version {{ version.name }}
            </NuxtLink>

            <NuxtLink
              :to="`/view/${version.identifier}`"
              class="text-sm text-slate-500 transition-all hover:text-slate-400 hover:underline"
            >
              {{ version.identifier }}
            </NuxtLink>
          </n-flex>

          <time class="text-sm">
            {{ displayStandardDate(version.published_on as string) }}
          </time>
        </n-flex>
      </div>
    </div>

    <div class="py-2 pl-3">
      <p class="text-sm">
        If you want to always link to the latest version, use the
        <NuxtLink
          :to="`/view/${collectionIdentifier}`"
          class="text-sky-500 transition-all hover:text-sky-400"
        >
          {{ collectionIdentifier }}</NuxtLink
        >
        identifier.
      </p>
    </div>
  </div>
</template>
