<script setup lang="ts">
definePageMeta({
  layout: "public",
});

useSeoMeta({
  title: "Home",
});

const logos = [
  {
    src: "https://raw.githubusercontent.com/fairdataihub/logo/refs/heads/main/SVG/05_Main_Logo_W_Stacked_Text/Main-Logo-Black-Stroke-Transparent.svg",
    alt: "FAIR Data Innovations Hub",
  },
  {
    src: "https://lirp.cdn-website.com/5209b07d/dms3rep/multi/opt/logo-356w.png",
    alt: "California Medical Innovations Institute",
  },
  {
    src: "https://3dtholdings.com/wp-content/uploads/2018/03/acculab-logo.png",
    alt: "AccuLab",
  },
  {
    src: "https://3dtholdings.com/wp-content/themes/3dt-holdings/assets/images/logo.png",
    alt: "3DT Holdings",
  },
];
</script>

<template>
  <main>
    <UBanner
      title="This website is still in alpha development."
      color="warning"
      icon="i-lucide-info"
    />

    <section class="mx-auto flex items-center">
      <div
        class="relative flex w-full items-center justify-center overflow-hidden rounded-2xl"
      >
        <GridPattern
          :offset-x="0"
          :offset-y="0"
          :size="60"
          class="absolute -inset-px h-full w-full [mask-image:radial-gradient(white,transparent_90%)] stroke-slate-300/80 stroke-[4] [stroke-dasharray:5_6] [stroke-dashoffset:10]"
        >
        </GridPattern>

        <div class="font-display relative text-4xl font-bold">
          <div
            class="relative mx-auto max-w-screen-xl px-4 pt-8 text-center lg:px-12 lg:pt-16"
          >
            <h1
              class="relative mb-4 bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text py-2 text-4xl font-black text-transparent md:text-5xl lg:text-6xl"
            >
              Creating the connections that matter
            </h1>

            <p
              class="mb-8 text-lg font-medium text-stone-700 sm:px-16 lg:text-xl xl:px-48 dark:text-stone-50"
            >
              Reimagining the links between scientific research outputs and the
              people who need them.
            </p>

            <div
              class="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-4 sm:space-y-0 lg:mb-16"
            >
              <NuxtLink
                to="/dashboard"
                class="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 inline-flex items-center justify-center rounded-lg px-5 py-3 text-center text-base font-medium text-white focus:ring-4"
              >
                Create a collection
                <svg
                  class="-mr-1 ml-2 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              </NuxtLink>

              <a
                href="#"
                class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-center text-base font-medium text-gray-900 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100"
              >
                <svg
                  class="mr-2 -ml-1 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"
                  ></path>
                </svg>
                Watch video
              </a>
            </div>

            <div
              class="mx-auto px-4 pb-5 text-center md:max-w-screen-md lg:max-w-screen-lg lg:px-36"
            >
              <span class="text-base font-medium text-gray-800 uppercase">
                Trusted by research teams around the world
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- <section class="relative hidden">
      <div
        class="relative mx-auto max-w-screen-xl px-4 pt-8 text-center lg:px-12 lg:pt-16"
      >
        <h1
          class="relative mb-4 bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text py-2 text-4xl font-extrabold text-transparent md:text-5xl lg:text-6xl"
        >
          Creating the connections that matter
        </h1>

        <p
          class="mb-8 text-lg font-medium text-stone-700 sm:px-16 lg:text-xl xl:px-48 dark:text-stone-50"
        >
          Reimagining the links between scientific research outputs and the
          people who need them.
        </p>

        <div class="blob-container relative -z-10 mx-auto max-w-lg">
          <div
            class="absolute -left-0 top-0 h-60 w-60 animate-blob rounded-full bg-yellow-300 opacity-70 mix-blend-multiply blur-xl filter"
          ></div>

          <div
            class="animation-delay-2000 absolute -right-0 top-0 h-60 w-60 animate-blob rounded-full bg-orange-300 opacity-70 mix-blend-multiply blur-xl filter"
          ></div>

          <div
            class="absolute -bottom-4 left-0 h-60 w-60 animate-blob rounded-full bg-cyan-300 opacity-70 mix-blend-multiply blur-xl filter"
          ></div>

          <div
            class="animation-delay-4000 absolute -bottom-0 right-0 h-60 w-60 animate-blob rounded-full bg-purple-300 opacity-70 mix-blend-multiply blur-xl filter"
          ></div>
        </div>

        <div
          class="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-4 sm:space-y-0 lg:mb-16"
        >
          <NuxtLink
            to="/dashboard"
            class="inline-flex items-center justify-center rounded-lg bg-primary-700 px-5 py-3 text-center text-base font-medium text-white hover:bg-primary-800 focus:ring-4 focus:ring-primary-300"
          >
            Create a collection
            <svg
              class="-mr-1 ml-2 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </NuxtLink>

          <a
            href="#"
            class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-center text-base font-medium text-gray-900 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100"
          >
            <svg
              class="-ml-1 mr-2 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"
              ></path>
            </svg>
            Watch video
          </a>
        </div>

        <div
          class="mx-auto px-4 pb-5 text-center md:max-w-screen-md lg:max-w-screen-lg lg:px-36"
        >
          <span class="font-medium uppercase text-gray-800">
            Trusted by research teams around the world
          </span>
        </div>
      </div>
    </section> -->

    <div>
      <Vue3Marquee clone gradient>
        <NuxtLink to="/#" v-for="logo in logos" :key="logo.alt">
          <img
            class="mx-6 h-auto w-[130px] grayscale transition-all hover:grayscale-0"
            :src="logo.src"
            :alt="logo.alt"
          />
        </NuxtLink>
      </Vue3Marquee>
    </div>
  </main>
</template>
