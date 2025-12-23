<script setup lang="ts">
const props = defineProps({
  versionIdentifier: {
    required: true,
    type: Number,
  },
});

const toast = useToast();

const pending = ref(true);

const chartOptions = ref({
  chart: {
    id: "version-resolutions-chart",
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
    `/api/discover/collections/${props.versionIdentifier}/resolutions`,
    {},
  )
    .then((data) => {
      chartOptions.value = {
        chart: {
          id: "version-resolutions-chart",
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
        description: "We couldn't load your version resolutions",
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

      <h2 class="py-2">Version Views</h2>
    </div>

    <ClientOnly>
      <apexchart type="bar" :options="chartOptions" :series="series" />
    </ClientOnly>
  </div>
</template>
