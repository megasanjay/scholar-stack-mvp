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
    } else if (member.role === "workspace-admin") {
      publishAccess.value.push(member);
    } else {
      editAccess.value.push(member);
    }
  }
};

if (members.value) {
  parseMembers(members.value);
}

const manageOptions = [
  {
    disabled: members.value?.length === 1,
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

const { data: viewers, error: viewersError } = await useFetch(
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
    <h2 class="text-xl">Publish Access</h2>

    <p class="pt-1 text-slate-700">
      The following members can publish this collection to the public. They can
      also edit the collection and manage its settings.
    </p>

    <n-divider />

    <div class="flex flex-col">
      <div
        v-for="member in publishAccess"
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
          <n-tag v-if="member.role === 'workspace-admin'" type="info">
            Workspace Administrator
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

    <h2 class="text-xl">Edit Access</h2>

    <p class="pt-1 text-slate-700">
      The following members can only edit this collection.
    </p>

    <n-divider />

    <div class="flex flex-col">
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

    <div class="mt-8 flex flex-col rounded-lg border border-zinc-300">
      <div class="rounded-lg bg-white p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-medium">Add editors to your collection</h3>
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
            <n-form-item label="Users" path="user">
              <n-input
                v-model:value="formValue.user"
                placeholder="hi@sciconnect.io"
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
            <Icon name="mdi:invite" />
          </template>

          Invite as editor
        </n-button>
      </div>

      <pre>
        {{ viewers }}
      </pre>
    </div>
  </div>
</template>
