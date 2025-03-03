<script setup lang="ts">
import notFoundAnimation from "@/assets/lottie/notFoundAnimation.json";
</script>

<template>
  <main class="grid h-screen place-items-center bg-slate-50 px-6 lg:px-8">
    <div class="text-center">
      <ClientOnly>
        <Vue3Lottie
          :animation-data="notFoundAnimation"
          :height="200"
          :width="200"
        />
      </ClientOnly>

      <h1
        class="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl"
      >
        Oops! Something went wrong
      </h1>

      <p class="mt-3 text-lg text-gray-600">
        Sorry, we couldn't find the resource you're looking for.
      </p>

      <div class="mt-10 flex items-center justify-center gap-x-6">
        <NuxtLink to="/">
          <UButton
            label="Go back home"
            color="primary"
            icon="heroicons-outline:home"
          />
        </NuxtLink>
      </div>
    </div>
  </main>
</template>
