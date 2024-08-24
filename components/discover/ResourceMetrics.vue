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
  <n-flex justify="space-between" align="center">
    <n-tag
      v-if="
        resourceType === 'dataset' ||
        resourceType === 'journalArticle' ||
        resourceType === 'poster'
      "
      type="info"
      round
      :bordered="false"
    >
      <template #icon>
        <Icon name="ic:baseline-bookmark" size="16" />
      </template>

      Cited {{ generateRandomNumber(3, 13) }} times
    </n-tag>

    <n-tag
      v-if="resourceType === 'dataset' || resourceType === 'software'"
      type="info"
      round
      :bordered="false"
    >
      <template #icon>
        <Icon name="ph:download-fill" size="16" />
      </template>

      Downloaded {{ generateRandomNumber(69, 420) }} times
    </n-tag>

    <n-tag
      v-if="resourceType === 'software'"
      type="info"
      round
      :bordered="false"
    >
      <template #icon>
        <Icon name="ph:star-fill" size="16" />
      </template>

      Has {{ generateRandomNumber(2, 23) }} stars
    </n-tag>

    <n-tag
      v-if="
        resourceType === 'poster' || resourceType === 'conferencePresentation'
      "
      type="info"
      round
      :bordered="false"
    >
      <template #icon>
        <Icon name="solar:eye-bold" size="16" />
      </template>

      Viewed {{ generateRandomNumber(20, 45) }} times
    </n-tag>

    <n-tag
      v-if="resourceType === 'other' || resourceType === 'webPage'"
      type="info"
      round
      :bordered="false"
    >
      <template #icon>
        <Icon name="tabler:click" size="16" />
      </template>

      {{ generateRandomNumber(545, 15234) }} clicks
    </n-tag>

    <n-tag v-if="resourceType === 'person'" type="info" round :bordered="false">
      <template #icon>
        <Icon name="mingcute:paper-line" size="16" />
      </template>

      Has {{ generateRandomNumber(2, 15) }} works
    </n-tag>
  </n-flex>
</template>
