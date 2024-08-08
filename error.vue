<script setup lang="ts">
import notFoundAnimation from "@/assets/lottie/notFoundAnimation.json";
</script>

<template>
  <NuxtLayout name="404">
    <main class="grid place-items-center bg-slate-50 px-6 lg:px-8">
      <div class="text-center">
        <ClientOnly>
          <Vue3Lottie
            :animation-data="notFoundAnimation"
            :height="200"
            :width="200"
          />
        </ClientOnly>

        <h1
          class="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl"
        >
          Oops! Something went wrong
        </h1>

        <p class="mt-6 text-base leading-7 text-gray-600">
          Sorry, we couldn't find the resource you're looking for.
        </p>

        <div class="mt-10 flex items-center justify-center gap-x-6">
          <NuxtLink
            to="/"
            class="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >Go back home</NuxtLink
          >

          <NuxtLink to="/contact" class="text-sm font-semibold text-gray-900">
            Contact support <span aria-hidden="true">&rarr;</span>
          </NuxtLink>
        </div>
      </div>
    </main>

    <!-- <main
    

        <Vue3Lottie
          :animation-data="notFoundAnimation"
          :height="400"
          :width="400"
        />
      </ClientOnly>

      <n-flex vertical align="center">
        <h1>We couldn't find the resource you're looking for</h1>

        <NuxtLink to="/" class="mt-6">
          <n-button color="black" size="large">
            <template #icon>
              <Icon name="mdi:home" />
            </template>
            Go back home</n-button
          >
        </NuxtLink>
      </n-flex>

      <n-back-top />
    </main> -->
  </NuxtLayout>
</template>
