<script setup lang="ts">
const { loggedIn, user } = useUserSession();

const devMode = process.env.NODE_ENV !== "production";

// Showing an alert for now but can redirect to a verification page later if needed
const emailVerified = computed(
  () => loggedIn.value && user.value?.emailVerified,
);
</script>

<template>
  <div
    class="relative mx-auto flex h-screen w-full flex-col"
    :class="{ 'debug-screens': devMode }"
  >
    <header>
      <nav class="border-b border-gray-200 bg-white px-4 py-2.5 lg:px-6">
        <div
          class="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between"
        >
          <NuxtLink
            to="/"
            class="flex flex-row items-center justify-start gap-2"
          >
            <span class="text-xl font-bold"> SciConnect </span>
          </NuxtLink>

          <div class="flex items-center gap-3 lg:order-2">
            <AppColorModeButton />

            <NuxtLink v-if="!loggedIn" to="/login">
              <UButton label="Log in" size="lg" />
            </NuxtLink>

            <NuxtLink v-if="!loggedIn" to="/register">
              <UButton label="Get started" color="neutral" size="lg" />
            </NuxtLink>

            <NuxtLink v-if="loggedIn" to="/dashboard">
              <UButton label="Dashboard" color="neutral" size="lg" />
            </NuxtLink>

            <UButton label="Logout" color="neutral" size="lg" />

            <button
              data-collapse-toggle="mobile-menu-2"
              type="button"
              class="ml-1 inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:outline-none lg:hidden"
              aria-controls="mobile-menu-2"
              aria-expanded="false"
            >
              <span class="sr-only">Open main menu</span>

              <svg
                class="h-6 w-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clip-rule="evenodd"
                ></path>
              </svg>

              <svg
                class="hidden h-6 w-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </button>
          </div>

          <div
            id="mobile-menu-2"
            class="hidden w-full items-center justify-between lg:order-1 lg:flex lg:w-auto"
          >
            <ul
              class="mt-4 flex flex-col font-medium lg:mt-0 lg:flex-row lg:space-x-8"
            >
              <li>
                <a
                  href="#"
                  class="lg:hover:text-primary-700 block border-b border-gray-100 py-2 pr-4 pl-3 text-gray-700 hover:bg-gray-50 lg:border-0 lg:p-0 lg:hover:bg-transparent"
                >
                  Team
                </a>
              </li>

              <li>
                <a
                  href="#"
                  class="lg:hover:text-primary-700 block border-b border-gray-100 py-2 pr-4 pl-3 text-gray-700 hover:bg-gray-50 lg:border-0 lg:p-0 lg:hover:bg-transparent"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>

    <slot />
  </div>
</template>
