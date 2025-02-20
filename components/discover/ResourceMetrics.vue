<script setup lang="ts">
defineProps({
  resourceType: {
    required: true,
    type: String,
  },
});

const generateRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <UBadge
      v-if="
        resourceType === 'dataset' ||
        resourceType === 'journalArticle' ||
        resourceType === 'software'
      "
      color="info"
      variant="soft"
      icon="ic:baseline-bookmark"
    >
      Cited {{ generateRandomNumber(3, 13) }} times
    </UBadge>

    <UBadge
      v-if="resourceType === 'dataset' || resourceType === 'software'"
      color="info"
      variant="soft"
      icon="ph:download-fill"
    >
      Downloaded {{ generateRandomNumber(69, 420) }} times
    </UBadge>

    <UBadge
      v-if="resourceType === 'software'"
      color="info"
      variant="soft"
      icon="ph:star-fill"
    >
      Has {{ generateRandomNumber(2, 23) }} stars
    </UBadge>

    <UBadge
      v-if="
        resourceType === 'poster' || resourceType === 'conferencePresentation'
      "
      color="info"
      variant="soft"
      icon="solar:eye-bold"
    >
      Viewed {{ generateRandomNumber(20, 45) }} times
    </UBadge>

    <UBadge
      v-if="resourceType === 'other' || resourceType === 'webPage'"
      color="info"
      variant="soft"
      icon="tabler:click"
    >
      {{ generateRandomNumber(545, 15234) }} clicks
    </UBadge>

    <UBadge
      v-if="resourceType === 'person'"
      color="info"
      variant="soft"
      icon="mingcute:paper-line"
    >
      Has {{ generateRandomNumber(2, 15) }} works
    </UBadge>
  </div>
</template>
