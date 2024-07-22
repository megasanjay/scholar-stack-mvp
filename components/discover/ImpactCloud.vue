<script setup lang="ts">
import WordCloud from "wordcloud";

const impactChart = ref<HTMLCanvasElement | null>(null);

onMounted(() => {
  if (!impactChart.value) {
    return;
  }

  if (!WordCloud.isSupported) {
    console.error("WordCloud is not supported");

    return;
  }

  WordCloud(impactChart, {
    list: [
      ["foo", 12],
      ["bar", 6],
    ],
  });
});
</script>

<template>
  <ClientOnly>
    <canvas id="impactChart" ref="impactChart" class="h-96 w-full"></canvas>
  </ClientOnly>
</template>
