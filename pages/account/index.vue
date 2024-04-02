<script setup lang="ts">
const displayName = ref("");
const affiliation = ref("");
const username = ref("");
const contactEmail = ref("");
const userId = ref("");

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

if (user.value) {
  displayName.value = user.value.name;
  affiliation.value = user.value.affiliation;
  username.value = user.value.username;
  contactEmail.value = user.value.contact_email_address;
  userId.value = user.value.id;
}
</script>

<template>
  <div class="flex flex-col space-y-4">
    <CardWithAction title="Avatar">
      <div class="flex items-start justify-between">
        <p class="my-3 text-sm">
          This is your avatar.
          <br />
          Click on the avatar to upload a custom one from your device.
        </p>

        <!-- <UiEditAvatar class="mr-5" /> -->
      </div>

      <template #action>
        <div class="flex h-full items-center justify-between">
          <p class="text-sm text-slate-600">
            An avatar is optional but strongly recommended.
          </p>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Display Name">
      <p class="my-3 text-sm">
        Please enter your full name, or a display name you are comfortable with.
      </p>

      <n-input
        v-model:value="displayName"
        placeholder="Gojo Satoru"
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
            :disabled="displayName.trim() === ''"
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

    <CardWithAction title="Affiliation">
      <p class="my-3 text-sm">
        Please enter your affiliation, or the organization you are associated
        with.
      </p>

      <n-input
        v-model:value="affiliation"
        placeholder="Jujutsu High School"
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
            :disabled="affiliation.trim() === ''"
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

    <CardWithAction title="Username">
      <p class="my-3 text-sm">
        Please enter your username, or the name you would like to be identified
        with.
      </p>

      <n-input
        v-model:value="username"
        placeholder="gojo_sensei"
        class="w-full"
        size="large"
      />

      <template #action>
        <div class="flex items-center justify-between">
          <p class="text-sm text-slate-600">
            Your username will be used to identify you across the platform.
          </p>

          <n-button
            type="primary"
            color="black"
            size="large"
            :loading="saveLoading"
            :disabled="username.trim() === ''"
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

    <CardWithAction title="Contact Email">
      <p class="my-3 text-sm">
        Please enter your contact email address, or the email address you would
        like to be contacted on.
      </p>

      <n-input
        v-model:value="contactEmail"
        placeholder="gojos@jjhs.jp"
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
            :disabled="contactEmail.trim() === ''"
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

    <CardWithAction title="User ID">
      <p class="my-3 text-sm">
        This is your unique user ID within the platform.
      </p>

      <n-input-group>
        <n-input
          v-model:value="userId"
          size="large"
          :style="{ width: '50%' }"
          disabled
        />

        <n-button type="info" secondary size="large">
          <template #icon>
            <Icon name="ic:round-content-copy" />
          </template>
        </n-button>
      </n-input-group>

      <template #action>
        <div class="flex h-full items-center justify-start">
          <p class="my-auto text-sm text-slate-600">
            Your user ID is unique and cannot be changed.
          </p>
        </div>
      </template>
    </CardWithAction>

    <CardWithAction title="Delete Account">
      <p class="my-3 text-sm">
        Permanently remove your account and all of its contents. Any published
        collections will not be removed. This action is not reversible, so
        please continue with caution.
      </p>

      <template #action>
        <div class="flex items-center justify-between">
          <p class="text-sm text-slate-600">
            This action is irreversible and will delete all your data.
          </p>

          <n-button
            type="error"
            size="large"
            :loading="saveLoading"
            disabled
            @click="console.log('Save clicked')"
          >
            <template #icon>
              <Icon name="healthicons:no" />
            </template>
            Delete Account
          </n-button>
        </div>
      </template>
    </CardWithAction>
  </div>
</template>
