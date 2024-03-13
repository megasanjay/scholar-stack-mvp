<script setup lang="ts">
const { collectionid, workspaceid } = useRoute().params as {
  collectionid: string;
  workspaceid: string;
};

const { data: creators, error } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/creators`,
  {
    headers: useRequestHeaders(["cookie"]),
  },
);

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your workspace details",
  });

  navigateTo("/dashboard");
}
</script>

<template>
  <div class="flex flex-col">
    <h2 class="text-xl">Creators</h2>

    <p class="mb-6 pt-1 text-slate-700">
      You can add or remove creators from this collection. The people and/or
      organizations listed here are also shown on the public catalog page.
    </p>

    <pre>
      {{ creators }}
    </pre>
  </div>
</template>
