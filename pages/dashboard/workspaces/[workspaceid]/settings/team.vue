<script setup lang="ts">
import { z } from "zod";
import type { FormSubmitEvent } from "#ui/types";
import { UInput, USeparator } from "#components";

const { user } = useUserSession();

const toast = useToast();
const route = useRoute();

const workspaceStore = useWorkspaceStore();

const createForm = useTemplateRef("createForm");

const schema = z.object({
  user: z.string().min(1, "Username is required"),
});

type Schema = z.output<typeof schema>;

const state = reactive({
  user: "",
});

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
  return currentWorkspace.value?.personal || false;
});

const tabItems = [
  {
    icon: "mdi:users",
    label: "Team Members",
    slot: "teamMembers",
  },
  {
    disabled: personalWorkspace.value,
    icon: "i-lucide-inbox",
    label: "Pending Invitations",
    slot: "pendingInvitations",
  },
];

const { data: members, error } = await useFetch(
  `/api/workspaces/${workspaceid}/members`,
  {},
);

if (error.value) {
  console.log(error.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    description: "We couldn't load your workspace details",
    icon: "material-symbols:error",
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
    ...((workspacePermission.value === "owner" ||
      workspacePermission.value === "admin") &&
    !selectedMember.admin &&
    !selectedMember.owner
      ? [
          {
            disabled:
              members.value?.members.length === 1 ||
              user.value?.id === memberId,
            icon: "i-lucide-user-plus",
            key: "makeWorkspaceAdmin",
            label: "Assign as Administrator",
            onSelect: () => {
              manageMember("makeWorkspaceAdmin");
            },
          },
        ]
      : []),
    ...(selectedMember.admin && selectedMember.id !== currentMember.id
      ? [
          {
            icon: "i-lucide-user-minus",
            key: "removeAdministrator",
            label: "Remove Administrator Role",
            onSelect: () => {
              manageMember("removeAdministrator");
            },
          },
        ]
      : []),

    ...(selectedMember.id === currentMember.id
      ? [
          {
            disabled: currentMember.owner,
            icon: "i-lucide-user-minus",
            key: "leaveWorkspace",
            label: "Leave Workspace",
            onSelect: () => {
              manageMember("leaveWorkspace");
            },
          },
        ]
      : []),
    ...(selectedMember.id !== currentMember.id
      ? [
          {
            disabled: selectedMember.owner || selectedMember.admin,
            icon: "i-lucide-user-minus",
            key: "removeMember",
            label: "Remove from Workspace",
            onSelect: () => {
              manageMember("removeMember");
            },
          },
        ]
      : []),
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

      method: "DELETE",
    })
      .then(async () => {
        if (key === "leaveWorkspace") {
          toast.add({
            title: "Left workspace",
            color: "success",
            description: "You've left this workspace",
            icon: "material-symbols:check-bold",
          });

          await navigateTo("/dashboard/workspaces");
        } else if (key === "removeMember") {
          toast.add({
            title: "Member removed",
            color: "success",
            description: "We've removed this member from your workspace",
            icon: "material-symbols:check-bold",
          });

          window.location.reload();
        }
      })
      .catch((err) => {
        console.log(err);
        toast.add({
          title: "Something went wrong",
          color: "error",
          description: "We couldn't remove this member from your workspace",
          icon: "material-symbols:error",
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

      method: "POST",
    })
      .then(() => {
        toast.add({
          title: "Member promoted",
          color: "success",
          description: "We've promoted this member to an administrator",
          icon: "material-symbols:check-bold",
        });

        window.location.reload();
      })
      .catch((err) => {
        console.log(err);

        toast.add({
          title: "Something went wrong",
          color: "error",
          description: "We couldn't promote this member to an administrator",
          icon: "material-symbols:error",
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

      method: "DELETE",
    })
      .then(() => {
        toast.add({
          title: "Administrator role removed",
          color: "success",
          description: "We've removed the administrator role from this member",
          icon: "material-symbols:check-bold",
        });

        window.location.reload();
      })
      .catch((err) => {
        console.log(err);

        toast.add({
          title: "Something went wrong",
          color: "error",
          description:
            "We couldn't remove the administrator role from this member",
          icon: "material-symbols:error",
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

    method: "DELETE",
  })
    .then(() => {
      toast.add({
        title: "Invitation cancelled",
        color: "success",
        description: "We've cancelled the invitation for this user",
        icon: "material-symbols:check-bold",
      });

      window.location.reload();
    })
    .catch((err) => {
      console.log(err);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't cancel the invitation for this user",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      permissionChangeLoading.value = "";
    });
};

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const body = {
    user: event.data.user,
  };

  inviteLoading.value = true;

  await $fetch(`/api/workspaces/${workspaceid}/members`, {
    body: JSON.stringify(body),

    method: "POST",
  })
    .then(() => {
      inviteLoading.value = false;

      toast.add({
        title: "Member invited",
        color: "success",
        description:
          "We've sent an invitation for this user to join your workspace",
        icon: "material-symbols:check-bold",
      });

      state.user = "";
    })
    .catch((err) => {
      console.log(err);

      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "We couldn't invite this user to your workspace",
        icon: "material-symbols:error",
      });
    })
    .finally(() => {
      inviteLoading.value = false;
    });
}
</script>

<template>
  <div class="flex flex-col">
    <h2 class="text-xl">Team</h2>

    <p class="pt-1 pb-6 text-slate-700">
      Invite your team members to collaborate on your workspace and projects.
    </p>

    <div class="flex flex-col rounded-lg border border-zinc-300">
      <div class="rounded-lg bg-white p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-medium">
            Invite new members to your workspace
          </h3>
        </div>

        <USeparator class="my-4" />

        <UForm
          ref="createForm"
          :schema="schema"
          :state="state"
          @submit="onSubmit"
        >
          <UFormField label="Email Address" name="user">
            <UInput
              v-model="state.user"
              placeholder="hi@sciconnect.io"
              size="lg"
              :disabled="
                personalWorkspace ||
                inviteLoading ||
                workspacePermissionGetLoading ||
                (workspacePermission !== 'owner' &&
                  workspacePermission !== 'admin')
              "
            />
          </UFormField>
        </UForm>
      </div>

      <div
        class="flex items-center justify-between rounded-lg bg-slate-50 px-6 py-3"
      >
        <p v-if="personalWorkspace" class="text-sm font-medium text-red-400">
          You cannot invite members to your personal workspace.
        </p>

        <p v-else class="text-sm font-medium text-stone-500">
          An invited user who already has an account on SciConnect will be
          automatically added to your workspace.
        </p>

        <UButton
          color="primary"
          icon="mingcute:invite-fill"
          size="lg"
          :loading="inviteLoading || workspacePermissionGetLoading"
          :disabled="
            personalWorkspace ||
            (workspacePermission !== 'owner' && workspacePermission !== 'admin')
          "
          @click="createForm?.submit()"
        >
          Send invite
        </UButton>
      </div>
    </div>

    <div class="py-6">
      <UTabs
        :items="tabItems"
        orientation="horizontal"
        variant="link"
        class="w-full gap-4"
        :ui="{ trigger: 'cursor-pointer' }"
      >
        <template #teamMembers>
          <div class="flex flex-col">
            <div class="flex items-center justify-between space-x-4 pt-2 pb-4">
              <UInput
                placeholder="Filter..."
                icon="iconamoon:search-duotone"
                size="lg"
                type="search"
              />
            </div>

            <div
              v-for="member in members?.members"
              :key="member.id"
              class="-mt-[1px] flex items-center justify-between rounded-md border border-slate-200 bg-white p-5"
            >
              <div class="flex items-center space-x-3">
                <UAvatar
                  size="xl"
                  class="rounded-sm"
                  :src="`https://api.dicebear.com/7.x/shapes/svg?seed=${member.id}`"
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
                <UBadge v-if="member.admin" color="info" variant="soft">
                  Administrator
                </UBadge>

                <UBadge v-if="member.owner" color="info" variant="soft">
                  Owner
                </UBadge>

                <USeparator
                  v-if="member.admin || member.owner"
                  orientation="vertical"
                  class="h-5"
                />

                <UDropdownMenu
                  :items="generateManageOptions(member.id)"
                  :content="{
                    align: 'end',
                    side: 'bottom',
                    sideOffset: 8,
                  }"
                  :ui="{
                    content: 'w-48',
                  }"
                >
                  <UButton
                    icon="iconamoon:menu-kebab-vertical-bold"
                    color="neutral"
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
                    variant="ghost"
                    @click="selectedMember = member.id"
                  />
                </UDropdownMenu>
              </div>
            </div>
          </div>
        </template>

        <template #pendingInvitations>
          <div class="flex flex-col">
            <div class="flex items-center justify-between space-x-4 pt-2 pb-4">
              <UInput
                placeholder="Filter..."
                icon="iconamoon:search-duotone"
                size="lg"
                type="search"
              />
            </div>

            <div
              v-for="member in members?.invitedMembers"
              :key="member.id"
              class="flex items-center justify-between border border-slate-200 bg-white p-5"
            >
              <div class="flex items-center space-x-3">
                <UAvatar
                  size="xl"
                  class="rounded-sm"
                  :src="`https://api.dicebear.com/7.x/shapes/svg?seed=${member.id}`"
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
                <UButton
                  v-if="
                    workspacePermission === 'owner' ||
                    workspacePermission === 'admin'
                  "
                  color="error"
                  :disabled="personalWorkspace"
                  :loading="
                    workspacePermissionGetLoading ||
                    permissionChangeLoading === member.id
                  "
                  icon="hugeicons:user-remove-01"
                  @click="cancelInvitation(member.id)"
                >
                  Cancel Invitation
                </UButton>
              </div>
            </div>
          </div>
        </template>
      </UTabs>
    </div>
  </div>
</template>
