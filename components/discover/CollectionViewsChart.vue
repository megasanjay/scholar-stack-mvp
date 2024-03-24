<script setup lang="ts">
const props = defineProps({
  collectionIdentifier: {
    required: true,
    type: String,
  },
});
const pending = ref(true);

const chartOptions = ref({
  chart: {
    id: "collection-views-chart",
  },
  xaxis: {
    categories: ["loading..."],
  },
});

const series = ref([
  {
    name: "Views",
    data: [0],
  },
]);

onMounted(() => {
  fetchChartData();
});

const fetchChartData = async () => {
  pending.value = true;
  await $fetch(
    `/api/discover/collections/${props.collectionIdentifier}/views`,
    {
      headers: useRequestHeaders(["cookie"]),
    },
  )
    .then((data) => {
      console.log(data);

      chartOptions.value = {
        chart: {
          id: "collection-views-chart",
        },
        xaxis: {
          categories: data.xAxis,
        },
      };
      series.value[0].data = data.yAxis;
    })
    .catch((error) => {
      console.error(error);
      push.error("Failed to fetch chart data");
    })
    .finally(() => {
      pending.value = false;
    });
};
</script>

<template>
  <div>
    <n-flex align="center">
      <Icon name="ion:eye-sharp" size="25" />

      <h2 class="py-2">Collection Views</h2>
    </n-flex>

    <ClientOnly>
      <n-spin :show="pending">
        <apexchart
          type="bar"
          :options="chartOptions"
          :series="series"
        ></apexchart>
      </n-spin>

      <template #fallback>
        <div class="h-[300px] w-2"></div>
      </template>
    </ClientOnly>
  </div>
</template>
