<script setup lang="ts">
const props = defineProps({
  collectionIdentifier: {
    required: true,
    type: Number,
  },
});

const toast = useToast();

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
    {},
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

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't load your collection views",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      pending.value = false;
    });
};
</script>

<template>
  <div>
    <div class="flex items-center">
      <Icon name="ion:eye-sharp" size="25" />

      <h2 class="py-2">Collection Views</h2>
    </div>

    <ClientOnly>
      <apexchart type="bar" :options="chartOptions" :series="series" />

      <template #fallback>
        <div class="h-[300px] w-2"></div>
      </template>
    </ClientOnly>
  </div>
</template>
