<script setup lang="ts">
import type { FormInst } from "naive-ui";

const push = usePush();

const formRef = ref<FormInst>();

const formValue = reactive({
  role: null,
  user: "",
});

const rules = {
  role: {
    message: "Please enter a role",
    required: true,
  },
  user: {
    message: "Please enter a username or email address",
    required: true,
  },
};

const options = [
  { label: "Admin", value: "admin" },
  { label: "Editor", value: "editor" },
  { label: "Viewer", value: "viewer" },
];

const inviteLoading = ref(false);

const { workspaceid } = useRoute().params as { workspaceid: string };

const { data: members, error } = await useFetch(
  `/api/workspaces/${workspaceid}/members`,
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
}

const manageOptions = [
  {
    disabled: members.value?.members.length === 1,
    key: "makeWorkspaceOwner",
    label: "Make Workspace Owner",
  },
  {
    key: "leaveWorkspace",
    label: "Leave Workspace",
  },
];

const manageMember = (key: string | number) => {
  console.log(key);
};

const inviteMember = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      const body = {
        role: formValue.role,
        user: formValue.user,
      };

      inviteLoading.value = true;

      const { data, error } = await useFetch(
        `/api/workspaces/${workspaceid}/members`,
        {
          body: JSON.stringify(body),
          headers: useRequestHeaders(["cookie"]),
          method: "POST",
        },
      );

      inviteLoading.value = false;

      if (error.value) {
        console.log(error.value);

        push.error({
          title: "Something went wrong",
          message: "We couldn't invite this user to your workspace",
        });
      }

      if (data.value) {
        push.success({
          title: "Member Invited",
          message:
            "We've sent an invitation for this user to join your workspace",
        });

        formValue.role = null;
        formValue.user = "";

        window.location.reload();
      }
    } else {
      console.log(errors);
    }
  });
};
</script>

<template>
  <div class="flex flex-col">
    <h2 class="text-xl">Team</h2>

    <p class="pt-1 text-slate-700">
      Users who have access to this collection and their roles
    </p>

    <n-divider />

    <div class="flex flex-col">
      <div class="flex items-center justify-between space-x-4 pb-4 pt-2">
        <n-input placeholder="Filter..." size="large">
          <template #prefix>
            <Icon name="iconamoon:search-duotone" size="20" class="mr-2" />
          </template>
        </n-input>

        <n-select
          v-model:value="formValue.role"
          :options="options"
          size="large"
          placeholder="All Team Roles"
        />

        <n-select :options="options" size="large" placeholder="Default Sort" />
      </div>

      <div
        v-for="member in members?.members"
        :key="member.id"
        class="flex items-center justify-between border border-slate-200 bg-white p-5"
      >
        <div class="flex items-center space-x-3">
          <n-avatar
            :src="`https://api.dicebear.com/6.x/thumbs/svg?seed=${member.id}`"
            :size="50"
            round
          />

          <div class="flex flex-col">
            <p class="font-bold">{{ member.username }}</p>

            <p class="text-sm text-slate-600">
              {{ member.emailAddress }}
            </p>

            <!-- <p class="text-xs">
                    Joined
                    {{ $dayjs(member.created).format("MMMM DD, YYYY") }}
                  </p> -->
          </div>
        </div>

        <div class="relative flex items-center space-x-6">
          <n-tag type="info">
            {{ useCapitalize(member.role) }}
          </n-tag>

          <n-dropdown
            trigger="click"
            placement="bottom-end"
            :options="manageOptions"
            @select="manageMember"
          >
            <n-button secondary>
              <template #icon>
                <Icon name="iconamoon:menu-kebab-vertical-bold" />
              </template>
            </n-button>
          </n-dropdown>
        </div>
      </div>
    </div>

    <n-divider />

    <div class="flex flex-col rounded-lg border border-zinc-300">
      <div class="rounded-lg bg-white p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-medium">Add members to your collection</h3>
        </div>

        <n-divider />

        <n-form
          ref="formRef"
          inline
          :label-width="80"
          :model="formValue"
          :rules="rules"
          size="large"
          class="space-x-8"
        >
          <div class="w-2/4">
            <n-form-item label="Users" path="user">
              <n-input
                v-model:value="formValue.user"
                placeholder="hi@sciconnect.io"
              />
            </n-form-item>
          </div>

          <div class="w-2/4">
            <n-form-item label="Role" path="role">
              <n-select
                v-model:value="formValue.role"
                :options="options"
                placeholder="Admin"
              />
            </n-form-item>
          </div>
        </n-form>
      </div>

      <div
        class="flex items-center justify-between rounded-lg bg-slate-50 px-6 py-3"
      >
        <p class="text-sm">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit.
        </p>

        <n-button
          color="black"
          size="large"
          :loading="inviteLoading"
          @click="inviteMember"
        >
          <template #icon>
            <Icon name="mingcute:invite-fill" />
          </template>

          Send Invite
        </n-button>
      </div>
    </div>
  </div>
</template>
