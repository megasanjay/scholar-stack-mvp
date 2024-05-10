<script setup lang="ts">
import type { SelectRenderTag, SelectRenderLabel } from "naive-ui";
import { NAvatar, NText } from "naive-ui";

const user = useSupabaseUser();

const userToInvite = ref<string | null>(null);

const inviteLoading = ref(false);

const publishAccess = ref<CollectionAccessTeam>([]);
const editAccess = ref<CollectionAccessTeam>([]);

const { collectionid, workspaceid } = useRoute().params as {
  collectionid: string;
  workspaceid: string;
};

const { data: members, error } = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/members`,
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
    {
      disabled: workspacePermission.value !== "owner",
      key: "removePublisher",
      label: "Remove publisher",
      show: memberid !== user.value?.id,
    },
    {
      disabled:
        workspacePermission.value === "owner" ||
        workspacePermission.value === "admin",
      key: "giveUpPublisherAccess",
      label: "Give up publisher access",
      show: memberid === user.value?.id,
    },
  ];
};

const generateEditorDropdownOptions = (memberid: string) => {
  return [
    {
      key: "makeAdmin",
      label: "Assign as administrator",
      show: collectionPermission.value === "admin",
    },
    {
      key: "removeEditor",
      label: "Remove editor",
      show: collectionPermission.value === "admin",
    },
    {
      key: "leaveCollection",
      label: "Leave collection",
      show: memberid === user.value?.id,
    },
  ];
};

const manageMember = async (userid: string | number) => {
  const body = {
    userid,
  };

  await $fetch(
    `/api/workspaces/${workspaceid}/collections/${collectionid}/members/admin`,
    {
      body: JSON.stringify(body),
      headers: useRequestHeaders(["cookie"]),
      method: "PUT",
    },
  )
    .then((response) => {
      push.success({
        title: "Success",
        message: "This editor has been assigned as an administrator",
      });

      // Add the member to the publish access list
      publishAccess.value.push({
        id: response.admin.id || "",
        username: response.admin.username || "",
        name: response.admin.name || "",
        created: new Date().toDateString(),
        emailAddress: response.admin.email_address || "",
        role: "collection-admin",
      });

      // Remove the member from the edit access list
      editAccess.value = editAccess.value.filter(
        (member) => member.id !== userid,
      );
    })
    .catch((error) => {
      console.log(error);

      push.error({
        title: "Something went wrong",
        message: "We couldn't assign this editor as an administrator",
      });
    });
};

const {
  data: viewers,
  error: viewersError,
  pending: viewersLoading,
} = await useFetch(
  `/api/workspaces/${workspaceid}/collections/${collectionid}/members/viewers`,
  {
    headers: useRequestHeaders(["cookie"]),
    lazy: true,
    server: false,
  },
);

if (viewersError.value) {
  console.log(viewersError.value);

  push.error({
    title: "Something went wrong",
    message: "We couldn't load the viewers of this collection",
  });
}

const renderSingleSelectTag: SelectRenderTag = ({ option }) => {
  return h(
    "div",
    {
      style: {
        alignItems: "center",
        display: "flex",
      },
    },
    [
      h(NAvatar, {
        round: true,
        size: 24,
        src: `https://api.dicebear.com/6.x/thumbs/svg?seed=${option.value}`,
        style: {
          marginRight: "12px",
        },
      }),
      option.label as string,
    ],
  );
};

const renderLabel: SelectRenderLabel = (option) => {
  return h(
    "div",
    {
      style: {
        alignItems: "center",
        display: "flex",
      },
    },
    [
      h(NAvatar, {
        round: true,
        src: `https://api.dicebear.com/6.x/thumbs/svg?seed=${option.value}`,
      }),
      h(
        "div",
        {
          style: {
            marginLeft: "12px",
            padding: "4px 0",
          },
        },
        [
          h("div", null, [option.label as string]),
          h(
            NText,
            { depth: 3, tag: "div" },
            {
              default: () => option.email_address,
            },
          ),
        ],
      ),
    ],
  );
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
      headers: useRequestHeaders(["cookie"]),
      method: "POST",
    },
  )
    .then((response) => {
      push.success({
        title: "Success",
        message: "This user has been added as an editor to your workspace",
      });

      editAccess.value.push({
        id: response.editor.user_id,
        username: response.editor.username || "",
        name: response.editor.name || "",
        created: response.editor.created,
        emailAddress: response.editor.email_address || "",
        role: "collection-editor",
      });

      userToInvite.value = null;
    })
    .catch((error) => {
      console.log(error);

      push.error({
        title: "Something went wrong",
        message: "We couldn't invite this user to your workspace",
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
          <n-avatar
            :src="`https://api.dicebear.com/6.x/thumbs/svg?seed=${member.id}`"
            :size="50"
            round
          />

          <div class="flex flex-col">
            <p class="font-bold">{{ member.name || member.username }}</p>

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
          <n-tag v-if="member.role === 'workspace-admin'" type="info">
            Workspace Administrator
          </n-tag>

          <n-tag v-if="member.role === 'workspace-owner'" type="info">
            Workspace Owner
          </n-tag>

          <n-tag v-if="member.role === 'collection-admin'" type="info">
            Administrator
          </n-tag>

          <n-divider vertical />

          <n-dropdown
            trigger="click"
            placement="bottom-end"
            :options="generatePublisherDropdownOptions(member.id)"
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
          <n-avatar
            :src="`https://api.dicebear.com/6.x/thumbs/svg?seed=${member.id}`"
            :size="50"
            round
          />

          <div class="flex flex-col">
            <p class="font-bold">{{ member.name || member.username }}</p>

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
          <n-dropdown
            trigger="click"
            placement="bottom-end"
            :options="generateEditorDropdownOptions(member.id)"
            @select="manageMember(member.id)"
          >
            <n-button secondary :loading="collectionPermissionGetLoading">
              <template #icon>
                <Icon name="iconamoon:menu-kebab-vertical-bold" />
              </template>
            </n-button>
          </n-dropdown>
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

        <n-divider />

        <n-form-item label="Users" size="large">
          <n-select
            v-model:value="userToInvite"
            :options="viewers || []"
            :render-label="renderLabel"
            :render-tag="renderSingleSelectTag"
            filterable
            :loading="viewersLoading"
            clearable
            :disabled="collectionPermission !== 'admin'"
            placeholder="Search for a user to invite"
          />
        </n-form-item>
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
          :disabled="!userToInvite"
          @click="inviteMember"
        >
          <template #icon>
            <Icon name="mdi:invite" />
          </template>

          Invite as editor
        </n-button>
      </div>
    </div>
  </div>
</template>
