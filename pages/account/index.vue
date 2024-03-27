<script setup lang="ts">
const workspaceName = ref("");

const saveLoading = ref(false);

const { data: user, error } = await useFetch(`/api/user`, {
  headers: useRequestHeaders(["cookie"]),
});

if (error.value) {
  console.log(error.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load your user details",
  });

  navigateTo("/dashboard");
}
</script>

<template>
  <div class="flex flex-col space-y-4">
    <CardWithAction title="Name">
      <p class="my-3 text-sm">
        This is the name of your workspace. A workspace is a place where you can
        organize your collections as well as invite other users to collaborate
        on your projects.
      </p>

      <n-input
        v-model:value="workspaceName"
        placeholder="Workspace Name"
        class="w-full"
        size="large"
      />

      <template #action>
        <div class="flex items-center justify-end">
          <n-button
            type="primary"
            color="black"
            size="large"
            :loading="saveLoading"
            :disabled="workspaceName.trim() === ''"
            @click="console.log('Save clicked')"
          >
            <template #icon>
              <Icon name="ic:round-save" />
            </template>
            Save
          </n-button>
        </div>
      </template>
    </CardWithAction>

    <pre>
      {{ user }}
    </pre>
  </div>
</template>
