<script setup lang="ts">
const supabase = useSupabaseClient();
const user = useSupabaseUser();

const loggedIn = computed(() => user.value);

const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.log(error);

  navigateTo("/login");
};
</script>

<template>
  <ClientOnly>
    <nuxt-link v-if="!loggedIn" to="/login">
      <n-button size="large">
        <span> Log in </span>
      </n-button>
    </nuxt-link>

    <nuxt-link v-if="!loggedIn" to="/register">
      <n-button color="black" size="large"> Get started </n-button>
    </nuxt-link>

    <HeadlessMenu
      v-if="loggedIn"
      as="div"
      class="relative z-10 inline-block text-left"
    >
      <div>
        <HeadlessMenuButton
          class="bg-opacity-20 hover:bg-opacity-30 focus-visible:ring-opacity-75 inline-flex w-full justify-center rounded-md text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <n-avatar
            :size="35"
            :src="`https://api.dicebear.com/6.x/thumbs/svg?seed=${user?.id}`"
            class="hover:cursor-pointer hover:opacity-80"
            round
          />
        </HeadlessMenuButton>
      </div>

      <transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <HeadlessMenuItems
          class="ring-opacity-5 absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 focus:outline-none"
        >
          <div class="px-1 py-1">
            <HeadlessMenuItem v-slot="{ active }">
              <NuxtLink
                to="/dashboard"
                :class="{
                  'bg-orange-500 text-white': active,
                  'text-gray-900': !active,
                }"
                class="group flex w-full cursor-pointer items-center rounded-md px-2 py-2 text-sm"
              >
                <Icon
                  name="uil:dashboard"
                  class="mr-2 h-5 w-5"
                  aria-hidden="true"
                />
                Dashboard
              </NuxtLink>
            </HeadlessMenuItem>

            <HeadlessMenuItem v-slot="{ active }">
              <NuxtLink
                to="/account"
                :class="{
                  'bg-teal-500 text-white': active,
                  'text-gray-900': !active,
                }"
                class="group flex w-full cursor-pointer items-center rounded-md px-2 py-2 text-sm"
              >
                <Icon
                  name="ic:baseline-settings"
                  class="mr-2 h-5 w-5"
                  aria-hidden="true"
                />
                Settings
              </NuxtLink>
            </HeadlessMenuItem>

            <HeadlessMenuItem v-slot="{ active }">
              <NuxtLink
                to="/starred"
                :class="{
                  'bg-teal-500 text-white': active,
                  'text-gray-900': !active,
                }"
                class="group flex w-full cursor-pointer items-center rounded-md px-2 py-2 text-sm"
              >
                <Icon
                  name="heroicons-solid:star"
                  class="mr-2 h-5 w-5"
                  aria-hidden="true"
                />
                Starred
              </NuxtLink>
            </HeadlessMenuItem>
          </div>

          <div class="px-1 py-1">
            <HeadlessMenuItem v-slot="{ active }">
              <NuxtLink
                to="/"
                :class="{
                  'bg-green-500 text-white': active,
                  'text-gray-900': !active,
                }"
                class="group flex w-full cursor-pointer items-center rounded-md px-2 py-2 text-sm"
              >
                <Icon
                  name="solar:home-bold"
                  class="mr-2 h-5 w-5"
                  aria-hidden="true"
                />
                Home
              </NuxtLink>
            </HeadlessMenuItem>

            <HeadlessMenuItem v-slot="{ active }">
              <button
                :class="{
                  'bg-sky-500 text-white': active,
                  'text-gray-900': !active,
                }"
                class="group flex w-full cursor-pointer items-center rounded-md px-2 py-2 text-sm"
                @click="logout"
              >
                <Icon
                  name="majesticons:logout"
                  class="mr-2 h-5 w-5"
                  aria-hidden="true"
                />

                Logout
              </button>
            </HeadlessMenuItem>
          </div>
        </HeadlessMenuItems>
      </transition>
    </HeadlessMenu>

    <template #fallback>
      <!-- this will be rendered on server side -->
      <n-spin size="small">
        <div class="h-[35px] w-[35px] rounded-full bg-yellow-50"></div>
      </n-spin>
    </template>
  </ClientOnly>
</template>
