<script setup lang="ts">
import type { FormInst } from "naive-ui";

const user = useSupabaseUser();
const push = usePush();

const workspaceStore = useWorkspaceStore();

const formRef = ref<FormInst>();

const formValue = reactive({
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

const inviteLoading = ref(false);

const { workspaceid } = useRoute().params as { workspaceid: string };

workspaceStore.getWorkspace(workspaceid);

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

const generateManageOptions = (memberId: string) => {
  return [
    {
      disabled: members.value?.members.length === 1,
      key: "makeWorkspaceAdmin",
      label: "Assign as Administrator",
    },
    {
      disabled: user.value?.id !== memberId,
      key: "leaveWorkspace",
      label: "Leave Workspace",
    },
  ];
};

const manageMember = (key: string | number) => {
  console.log(key);
};

const inviteMember = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      const body = {
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

    <p class="pb-6 pt-1 text-slate-700">
      Invite your team members to collaborate on your workspace and projects.
    </p>

    <div class="flex flex-col rounded-lg border border-zinc-300">
      <div class="rounded-lg bg-white p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-medium">
            Invite new members to your workspace
          </h3>
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
          <div class="w-full">
            <n-form-item label="Username or Email Address" path="user">
              <n-input
                v-model:value="formValue.user"
                :disabled="workspaceStore.workspace?.personal"
                placeholder="hi@sciconnect.io"
              />
            </n-form-item>
          </div>
        </n-form>
      </div>

      <div
        class="flex items-center justify-between rounded-lg bg-slate-50 px-6 py-3"
      >
        <p
          v-if="workspaceStore.workspace?.personal"
          class="text-sm text-red-400"
        >
          You cannot invite members to your personal workspace.
        </p>

        <p v-else class="text-sm">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit.
        </p>

        <n-button
          color="black"
          size="large"
          :loading="inviteLoading"
          :disabled="workspaceStore.workspace?.personal"
          @click="inviteMember"
        >
          <template #icon>
            <Icon name="mingcute:invite-fill" />
          </template>

          Send Invite
        </n-button>
      </div>
    </div>

    <div class="py-6">
      <n-tabs type="line" animated>
        <n-tab-pane name="teamMembers" tab="Team Members">
          <div class="flex flex-col">
            <div class="flex items-center justify-between space-x-4 pb-4 pt-2">
              <n-input placeholder="Filter..." size="large">
                <template #prefix>
                  <Icon
                    name="iconamoon:search-duotone"
                    size="20"
                    class="mr-2"
                  />
                </template>
              </n-input>
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
                  <p class="font-bold">
                    {{
                      user?.id === member.id
                        ? "Me"
                        : member.name || "Anonymous User"
                    }}
                  </p>

                  <p class="text-sm text-slate-600">
                    {{ member.emailAddress }}
                  </p>
                </div>
              </div>

              <div class="relative flex items-center space-x-6">
                <n-tag v-if="member.admin" type="info"> Administrator </n-tag>

                <n-tag v-if="member.owner" type="info"> Owner </n-tag>

                <n-divider v-if="member.admin || member.owner" vertical />

                <n-dropdown
                  trigger="click"
                  placement="bottom-end"
                  :options="generateManageOptions(member.id)"
                  @select="manageMember"
                >
                  <n-button
                    secondary
                    :disabled="workspaceStore.workspace?.personal"
                  >
                    <template #icon>
                      <Icon name="iconamoon:menu-kebab-vertical-bold" />
                    </template>
                  </n-button>
                </n-dropdown>
              </div>
            </div>
          </div>
        </n-tab-pane>

        <n-tab-pane name="pendingInvitations" tab="Pending Invitations">
          <div class="flex flex-col">
            <div class="flex items-center justify-between space-x-4 pb-4 pt-2">
              <n-input placeholder="Filter..." size="large">
                <template #prefix>
                  <Icon
                    name="iconamoon:search-duotone"
                    size="20"
                    class="mr-2"
                  />
                </template>
              </n-input>
            </div>

            <div
              v-for="member in members?.invitedMembers"
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
                  <p class="font-bold">{{ member.id }}</p>

                  <p class="text-sm text-slate-600">
                    Invited on
                    {{ $dayjs(member.created).format("MMMM DD, YYYY") }}
                  </p>
                </div>
              </div>

              <div class="relative flex items-center space-x-6">
                <n-dropdown
                  trigger="click"
                  placement="bottom-end"
                  :options="generateManageOptions(member.id)"
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
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>
