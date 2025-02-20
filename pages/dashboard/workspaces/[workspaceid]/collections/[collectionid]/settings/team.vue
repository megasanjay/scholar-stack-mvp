<script setup lang="ts">
const { user } = useUserSession();

const toast = useToast();

const userToInvite = ref<string | undefined>(undefined);

const inviteLoading = ref(false);
const permissionChangeLoading = ref("");

const publishAccess = ref<CollectionAccessTeam>([]);
const editAccess = ref<CollectionAccessTeam>([]);

const selectedMember = ref<string | null>(null);

const { collectionid, workspaceid } = useRoute().params as {
  collectionid: string;
  workspaceid: string;
};

const { data: members, error } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/members`,
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

const parseMembers = (members: any) => {
  for (const member of members) {
    if (member.role === "collection-admin") {
      publishAccess.value.push(member);
    } else if (
      member.role === "workspace-admin" ||
      member.role === "workspace-owner"
    ) {
      publishAccess.value.push(member);
    } else {
      editAccess.value.push(member);
    }
  }
};

if (members.value) {
  parseMembers(members.value);
}

const { collectionPermission, collectionPermissionGetLoading } =
  await useCollectionPermission(workspaceid, collectionid);

const { workspacePermission, workspacePermissionGetLoading } =
  await useWorkspacePermission(workspaceid);

const generatePublisherDropdownOptions = (memberid: string) => {
  return [
    ...(memberid !== user.value?.id
      ? [
          {
            disabled: workspacePermission.value !== "owner",
            key: "removePublisher",
            label: "Remove publisher",
            onSelect: () => {
              publisherManageMember("removePublisher");
            },
          },
        ]
      : []),
    ...(memberid === user.value?.id
      ? [
          {
            disabled:
              workspacePermission.value === "owner" ||
              workspacePermission.value === "admin",
            key: "giveUpPublisherAccess",
            label: "Give up publisher access",
            onSelect: () => {
              publisherManageMember("giveUpPublisherAccess");
            },
          },
        ]
      : []),
  ];
};

const generateEditorDropdownOptions = (memberid: string) => {
  return [
    ...(collectionPermission.value === "admin"
      ? [
          {
            key: "makeAdmin",
            label: "Assign as administrator",
            onSelect: () => {
              editorManageMember("makeAdmin");
            },
          },
          {
            key: "removeEditor",
            label: "Remove editor",
            onSelect: () => {
              editorManageMember("removeEditor");
            },
          },
        ]
      : []),
    ...(memberid === user.value?.id
      ? [
          {
            key: "leaveCollection",
            label: "Leave collection",
            onSelect: () => {
              editorManageMember("leaveCollection");
            },
          },
        ]
      : []),
  ];
};

const {
  data: viewers,
  error: viewersError,
  pending: viewersLoading,
} = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/members/viewers`,
  {
    lazy: true,
    server: false,
  },
);

if (viewersError.value) {
  console.log(viewersError.value);

  toast.add({
    title: "Something went wrong",
    color: "error",
    description: "We couldn't load the viewers of this collection",
    icon: "material-symbols:error",
  });
}

const publisherManageMember = async (key: string) => {
  if (key === "removePublisher") {
    const member = publishAccess.value.find(
      (member) => member.id === selectedMember.value,
    );

    if (!member) {
      throw new Error("Member not found");
    }

    if (
      !workspacePermission.value &&
      (workspacePermission.value === "owner" ||
        workspacePermission.value === "admin")
    ) {
      toast.add({
        title: "Something went wrong",
        color: "error",
        description: "You don't have permission to remove this publisher",
        icon: "material-symbols:error",
      });

      return;
    }

    permissionChangeLoading.value = member.id;

    const body = {
      userid: member.id,
    };

    await $fetch(
      `/api/workspaces/${workspaceid}/collections/${collectionid}/members/publishers`,
      {
        body: JSON.stringify(body),

        method: "DELETE",
      },
    )
      .then(() => {
        toast.add({
          title: "Publisher removed",
          color: "success",
          description:
            "The publisher permission has been removed from this user",
          icon: "material-symbols:check-circle-outline",
        });

        // Remove the member from the publish access list
        publishAccess.value = publishAccess.value.filter(
          (member) => member.id !== selectedMember.value,
        );

        // Add the member to the edit access list
        editAccess.value.push({
          id: member.id,
          name: member.name || "",
          created: member.created,
          emailAddress: member.emailAddress || "",
          role: "collection-editor",
        });
      })
      .catch((error) => {
        console.log(error);

        toast.add({
          title: "Something went wrong",
          color: "error",
          description:
            "We couldn't remove the publisher permission from this user",
          icon: "material-symbols:error",
        });
      })
      .finally(() => {
        permissionChangeLoading.value = "";
      });
  } else if (key === "giveUpPublisherAccess") {
    console.log("Give up publisher access");
  }
};

const editorManageMember = async (key: string) => {
  if (key === "makeAdmin") {
    const member = editAccess.value.find(
      (member) => member.id === selectedMember.value,
    );

    if (!member) {
      throw new Error("Member not found");
    }

    permissionChangeLoading.value = member.id;

    const body = {
      userid: member.id,
    };

    await $fetch(
      `/api/workspaces/${workspaceid}/collections/${collectionid}/members/admin`,
      {
        body: JSON.stringify(body),

        method: "PUT",
      },
    )
      .then((response) => {
        toast.add({
          title: "Administrator assigned",
          color: "success",
          description: "This editor has been assigned as an administrator",
          icon: "material-symbols:check-circle-outline",
        });

        // Add the member to the publish access list
        publishAccess.value.push({
          id: response.admin.id || "",
          name: response.admin.name || "",
          created: new Date().toDateString(),
          emailAddress: response.admin.emailAddress || "",
          role: "collection-admin",
        });

        // Remove the member from the edit access list
        editAccess.value = editAccess.value.filter(
          (entry) => entry.id !== member.id,
        );
      })
      .catch((error) => {
        console.log(error);

        toast.add({
          title: "Something went wrong",
          color: "error",
          description: "We couldn't assign this editor as an administrator",
          icon: "material-symbols:error",
        });
      })
      .finally(() => {
        permissionChangeLoading.value = "";
      });
  } else if (key === "removeEditor" || key === "leaveCollection") {
    const member = editAccess.value.find(
      (member) => member.id === selectedMember.value,
    );

    if (!member) {
      throw new Error("Member not found");
    }

    permissionChangeLoading.value = member.id;

    const body = {
      userid: member.id,
    };

    await $fetch(
      `/api/workspaces/${workspaceid}/collections/${collectionid}/members/editors`,
      {
        body: JSON.stringify(body),

        method: "DELETE",
      },
    )
      .then(() => {
        toast.add({
          title: "Editor removed",
          color: "success",
          description: "This editor has been removed from the collection",
          icon: "material-symbols:check-circle-outline",
        });

        // Remove the member from the edit access list
        editAccess.value = editAccess.value.filter(
          (entry) => entry.id !== member.id,
        );

        // Add the member to the viewers list
        viewers.value?.push({
          email_address: member.emailAddress,
          label: member.name || "",
          value: member.id,
        });
      })
      .catch((error) => {
        console.error(error);

        if (key === "removeEditor") {
          toast.add({
            title: "Editor removed",
            color: "error",
            description: "We couldn't remove this editor from the collection",
            icon: "material-symbols:error",
          });
        }

        if (key === "leaveCollection") {
          toast.add({
            title: "Editor removed",
            color: "error",
            description:
              "We couldn't remove your editor permission from this collection",
            icon: "material-symbols:error",
          });
        }
      })
      .finally(() => {
        permissionChangeLoading.value = "";
      });
  }
};

const inviteMember = async () => {
  const body = {
    userid: userToInvite.value,
  };

  inviteLoading.value = true;

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/members/editors`,
    {
      body: JSON.stringify(body),

      method: "POST",
    },
  )
    .then((response) => {
      toast.add({
        title: "Editor added",
        color: "success",
        description: "This user has been added as an editor to your workspace",
        icon: "material-symbols:check-circle-outline",
      });

      // Add the user to the edit access list
      editAccess.value.push({
        id: response.editor.id,
        name: response.editor.name || "",
        created: response.editor.created,
        emailAddress: response.editor.emailAddress || "",
        role: "collection-editor",
      });

      // Remove the user from the viewers list
      viewers.value =
        viewers.value?.filter(
          (viewer) => viewer.value !== userToInvite.value,
        ) || [];

      userToInvite.value = undefined;
    })
    .catch((error) => {
      console.log(error);

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
};
</script>

<template>
  <div class="flex flex-col">
    <h2 class="text-xl">Publish Access</h2>

    <p class="mb-6 pt-1 text-slate-700">
      The following members can publish this collection to the public. They can
      also edit the collection and manage its settings.
    </p>

    <div class="flex flex-col">
      <div
        v-for="member in publishAccess"
        :key="member.id"
        class="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-5"
      >
        <div class="flex items-center space-x-3">
          <UAvatar
            :src="`https://api.dicebear.com/7.x/shapes/svg?seed=${member.id}`"
            size="xl"
          />

          <div class="flex flex-col">
            <p class="font-bold">{{ member.name }}</p>

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
          <UBadge
            v-if="member.role === 'workspace-admin'"
            color="info"
            variant="soft"
          >
            Workspace Administrator
          </UBadge>

          <UBadge
            v-if="member.role === 'workspace-owner'"
            color="info"
            variant="soft"
          >
            Workspace Owner
          </UBadge>

          <UBadge
            v-if="member.role === 'collection-admin'"
            color="info"
            variant="soft"
          >
            Administrator
          </UBadge>

          <USeparator orientation="vertical" class="h-5" />

          <UDropdownMenu
            :items="generatePublisherDropdownOptions(member.id)"
            :content="{
              align: 'end',
              side: 'bottom',
              sideOffset: 8,
            }"
            :ui="{
              content: 'w-max',
            }"
          >
            <UButton
              icon="iconamoon:menu-kebab-vertical-bold"
              color="neutral"
              :disabled="workspacePermission === 'viewer'"
              :loading="
                collectionPermissionGetLoading ||
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

    <h2 class="mt-12 text-xl">Edit Access</h2>

    <p class="mb-6 pt-1 text-slate-700">
      The following members can only edit this collection.
    </p>

    <div v-if="editAccess.length > 0" class="flex flex-col">
      <div
        v-for="member in editAccess"
        :key="member.id"
        class="flex items-center justify-between border border-slate-200 bg-white p-5"
      >
        <div class="flex items-center space-x-3">
          <UAvatar
            :src="`https://api.dicebear.com/7.x/shapes/svg?seed=${member.id}`"
            size="xl"
          />

          <div class="flex flex-col">
            <p class="font-bold">{{ member.name }}</p>

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
          <UDropdownMenu
            :items="generateEditorDropdownOptions(member.id)"
            :content="{
              align: 'end',
              side: 'bottom',
              sideOffset: 8,
            }"
            :ui="{
              content: 'w-48',
            }"
            @select="editorManageMember"
          >
            <UButton
              icon="iconamoon:menu-kebab-vertical-bold"
              color="neutral"
              :loading="
                collectionPermissionGetLoading ||
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

    <div v-else class="flex flex-col">
      <div
        class="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-5"
      >
        <p class="text-center font-bold text-slate-600">
          No additional members have edit access to this collection
        </p>
      </div>
    </div>

    <div class="mt-8 flex flex-col rounded-lg border border-zinc-300">
      <div class="rounded-lg bg-white p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-medium">Add editors to your collection</h3>
        </div>

        <USeparator class="my-4" />

        <UFormItem label="Users" size="large">
          <USelect
            v-model="userToInvite"
            :items="viewers || []"
            :loading="viewersLoading"
            :disabled="collectionPermission !== 'admin'"
            placeholder="Search for a user to invite"
            size="lg"
            class="w-full"
          />
        </UFormItem>
      </div>

      <div
        class="flex items-center justify-between rounded-lg bg-slate-50 px-6 py-3"
      >
        <p class="text-sm">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit.
        </p>

        <UButton
          color="primary"
          size="lg"
          :loading="inviteLoading"
          :disabled="!userToInvite"
          icon="mingcute:invite-fill"
          @click="inviteMember"
        >
          Invite as editor
        </UButton>
      </div>
    </div>
  </div>
</template>
