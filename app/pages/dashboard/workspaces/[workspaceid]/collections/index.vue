<script setup lang="ts">
definePageMeta({
  layout: "app-layout",
  middleware: ["auth"],
});

const route = useRoute();

const { workspaceid } = route.params as {
  collectionid: string;
  workspaceid: string;
};

navigateTo(`/dashboard/workspaces/${workspaceid}`);
</script>

<template>
  <client-only>
    <Vue3Lottie
      animation-link="https://assets10.lottiefiles.com/packages/lf20_AQEOul.json"
      :height="200"
      :width="200"
    />
  </client-only>
</template>
