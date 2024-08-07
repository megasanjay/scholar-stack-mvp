<script setup lang="ts">
import type { FormInst } from "naive-ui";

const user = useSupabaseUser();
const route = useRoute();

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

const permissionChangeLoading = ref("");
const inviteLoading = ref(false);

const selectedMember = ref<string | null>(null);

const { workspaceid } = route.params as { workspaceid: string };

const currentWorkspace = computed(() => {
  const allWorkspaces = workspaceStore.workspaces;

  return allWorkspaces.find(
    (workspace: Workspace) => workspace.id === workspaceid,
  );
});

const personalWorkspace = computed(() => {
  return currentWorkspace.value?.personal;
});

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

const { workspacePermission, workspacePermissionGetLoading } =
  await useWorkspacePermission(workspaceid);

const generateManageOptions = (memberId: string) => {
  // me
  const currentMember = members.value?.members.find(
    (member) => member.id === user.value?.id,
  );

  // target member
  const selectedMember = members.value?.members.find(
    (member) => member.id === memberId,
  );

  if (!selectedMember || !currentMember) {
    return [];
  }

  return [
    {
      disabled:
        members.value?.members.length === 1 || user.value?.id === memberId,
      key: "makeWorkspaceAdmin",
      label: "Assign as Administrator",
      show:
        (workspacePermission.value === "owner" ||
          workspacePermission.value === "admin") &&
        !selectedMember.admin &&
        !selectedMember.owner,
    },
    {
      key: "removeAdministrator",
      label: "Remove Administrator Role",
      show: selectedMember.admin && selectedMember.id !== currentMember.id,
    },
    {
      disabled: currentMember.owner,
      key: "leaveWorkspace",
      label: "Leave Workspace",
      show: selectedMember.id === currentMember.id,
    },
    {
      disabled: selectedMember.owner || selectedMember.admin,
      key: "removeMember",
      label: "Remove from Workspace",
      show: selectedMember.id !== currentMember.id,
    },
  ];
};

const manageMember = async (key: string) => {
  if (!selectedMember.value) {
    return;
  }

  if (key === "removeMember" || key === "leaveWorkspace") {
    const body = {
      userid: selectedMember.value,
    };

    permissionChangeLoading.value = selectedMember.value;

    await $fetch(`/api/workspaces/${workspaceid}/members`, {
      body: JSON.stringify(body),
      headers: useRequestHeaders(["cookie"]),
      method: "DELETE",
    })
      .then(async (_res) => {
        if (key === "leaveWorkspace") {
          push.success({
            title: "Left Workspace",
            message: "You've left this workspace",
          });

          await navigateTo("/dashboard/workspaces");
        } else if (key === "removeMember") {
          push.success({
            title: "Member Removed",
            message: "We've removed this member from your workspace",
          });

          window.location.reload();
        }
      })
      .catch((err) => {
        console.log(err);

        push.error({
          title: "Something went wrong",
          message: "We couldn't remove this member from your workspace",
        });
      })
      .finally(() => {
        permissionChangeLoading.value = "";
      });
  }
  if (key === "makeWorkspaceAdmin") {
    const body = {
      userid: selectedMember.value,
    };

    permissionChangeLoading.value = selectedMember.value;

    await $fetch(`/api/workspaces/${workspaceid}/members/admin`, {
      body: JSON.stringify(body),
      headers: useRequestHeaders(["cookie"]),
      method: "POST",
    })
      .then((_res) => {
        push.success({
          title: "Member Promoted",
          message: "We've promoted this member to an administrator",
        });

        window.location.reload();
      })
      .catch((err) => {
        console.log(err);

        push.error({
          title: "Something went wrong",
          message: "We couldn't promote this member to an administrator",
        });
      })
      .finally(() => {
        permissionChangeLoading.value = "";
      });
  } else if (key === "removeAdministrator") {
    const body = {
      userid: selectedMember.value,
    };

    permissionChangeLoading.value = selectedMember.value;

    await $fetch(`/api/workspaces/${workspaceid}/members/admin`, {
      body: JSON.stringify(body),
      headers: useRequestHeaders(["cookie"]),
      method: "DELETE",
    })
      .then((_res) => {
        push.success({
          title: "Administrator Role Removed",
          message: "We've removed the administrator role from this member",
        });

        window.location.reload();
      })
      .catch((err) => {
        console.log(err);

        push.error({
          title: "Something went wrong",
          message: "We couldn't remove the administrator role from this member",
        });
      })
      .finally(() => {
        permissionChangeLoading.value = "";
      });
  } else if (key === "leaveWorkspace") {
    console.log("Leave Workspace");
  }
};

const cancelInvitation = async (memberId: string) => {
  permissionChangeLoading.value = memberId;

  await $fetch(`/api/workspaces/${workspaceid}/members/invitation`, {
    body: JSON.stringify({ emailAddress: memberId }),
    headers: useRequestHeaders(["cookie"]),
    method: "DELETE",
  })
    .then((_res) => {
      push.success({
        title: "Invitation Cancelled",
        message: "We've cancelled the invitation for this user",
      });

      window.location.reload();
    })
    .catch((err) => {
      console.log(err);

      push.error({
        title: "Something went wrong",
        message: "We couldn't cancel the invitation for this user",
      });
    })
    .finally(() => {
      permissionChangeLoading.value = "";
    });
};

const inviteMember = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      const body = {
        user: formValue.user,
      };

      inviteLoading.value = true;

      await $fetch(`/api/workspaces/${workspaceid}/members`, {
        body: JSON.stringify(body),
        headers: useRequestHeaders(["cookie"]),
        method: "POST",
      })
        .then((_res) => {
          inviteLoading.value = false;

          push.success({
            title: "Member Invited",
            message:
              "We've sent an invitation for this user to join your workspace",
          });

          formValue.user = "";

          window.location.reload();
        })
        .catch((err) => {
          console.log(err);

          push.error({
            title: "Something went wrong",
            message: "We couldn't invite this user to your workspace",
          });
        })
        .finally(() => {
          inviteLoading.value = false;
        });
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
                :disabled="
                  personalWorkspace ||
                  inviteLoading ||
                  workspacePermissionGetLoading ||
                  (workspacePermission !== 'owner' &&
                    workspacePermission !== 'admin')
                "
                placeholder="hi@scitrace.io"
              />
            </n-form-item>
          </div>
        </n-form>
      </div>

      <div
        class="flex items-center justify-between rounded-lg bg-slate-50 px-6 py-3"
      >
        <p v-if="personalWorkspace" class="text-sm font-medium text-red-400">
          You cannot invite members to your personal workspace.
        </p>

        <p v-else class="text-sm font-medium text-stone-500">
          An invited user who already has an account on SciTrace will be
          automatically added to your workspace.
        </p>

        <n-button
          color="black"
          size="large"
          :loading="inviteLoading || workspacePermissionGetLoading"
          :disabled="
            personalWorkspace ||
            (workspacePermission !== 'owner' && workspacePermission !== 'admin')
          "
          @click="inviteMember"
        >
          <template #icon>
            <Icon name="mingcute:invite-fill" />
          </template>

          Send Invite
        </n-button>
      </div>
    </div>

    <pre>{{ selectedMember }}</pre>

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
              class="-mt-[1px] flex items-center justify-between border border-slate-200 bg-white p-5"
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
                    :disabled="
                      personalWorkspace ||
                      (member.id !== user?.id &&
                        workspacePermission !== 'owner' &&
                        workspacePermission !== 'admin')
                    "
                    :loading="
                      workspacePermissionGetLoading ||
                      permissionChangeLoading === member.id
                    "
                    @click="selectedMember = member.id"
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

        <n-tab-pane
          name="pendingInvitations"
          tab="Pending Invitations"
          :disabled="personalWorkspace"
        >
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
                <n-button
                  v-if="
                    workspacePermission === 'owner' ||
                    workspacePermission === 'admin'
                  "
                  secondary
                  type="error"
                  :disabled="personalWorkspace"
                  :loading="
                    workspacePermissionGetLoading ||
                    permissionChangeLoading === member.id
                  "
                  @click="cancelInvitation(member.id)"
                >
                  <template #icon>
                    <Icon name="hugeicons:user-remove-01" />
                  </template>
                  Cancel Invitation
                </n-button>
              </div>
            </div>
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>
