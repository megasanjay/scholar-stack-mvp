<script setup lang="ts">
const impact = [
  {
    title: "Total Journal Articles",
    value: Math.floor(Math.random() * 5) + 1,
  },
  {
    title: "Total Citations",
    value: Math.floor(Math.random() * 100) + 1,
  },
  {
    title: "Total Patents",
    value: Math.floor(Math.random() * 10) + 1,
  },
  {
    title: "Total Grants",
    value: Math.floor(Math.random() * 10) + 1,
  },
];
</script>

<template>
  <div class="grid grid-cols-3 gap-4 py-5">
    <div
      v-for="item in impact"
      :key="item.title"
      class="flex flex-col space-y-1 rounded-md border border-slate-200 bg-white px-3 py-4 shadow-md"
    >
      <dt class="w-auto flex-1 text-base">{{ item.title }}</dt>

      <dd class="text-3xl font-black">{{ item.value }}</dd>
    </div>
  </div>
</template>
