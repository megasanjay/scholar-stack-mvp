<script setup lang="ts">
definePageMeta({
  layout: "public",
});
</script>

<template>
  <main>
    <div
      class="mb-4 flex items-center justify-center rounded-lg border bg-yellow-50 p-4 text-lg text-yellow-600"
      role="alert"
    >
      <svg
        class="mr-3 inline h-4 w-4 flex-shrink-0"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"
        />
      </svg>

      <span class="sr-only">Info</span>

      <div>
        <span class="font-medium">Warning!</span> This website is still in alpha
        development.
      </div>
    </div>

    <section class="relative">
      <div
        class="relative mx-auto max-w-screen-xl px-4 pt-8 text-center lg:px-12 lg:pt-16"
      >
        <h1
          class="relative mb-4 bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text py-2 text-4xl font-extrabold text-transparent md:text-5xl lg:text-6xl"
        >
          Creating the connections that matter
        </h1>

        <p
          class="mb-8 text-lg font-medium text-gray-700 sm:px-16 lg:text-xl xl:px-48"
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
          class="mb-8 flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0 lg:mb-16"
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
    </section>

    <div>
      <Vue3Marquee clone gradient>
        <NuxtLink to="/#">
          <img
            class="mx-6 h-auto w-[130px] grayscale transition-all hover:grayscale-0"
            src="https://cdn.worldvectorlogo.com/logos/broad-institute.svg"
            alt=""
          />
        </NuxtLink>

        <NuxtLink to="/#">
          <img
            class="mx-6 h-auto w-[130px] grayscale transition-all hover:grayscale-0"
            src="https://cdn.worldvectorlogo.com/logos/emory-university.svg"
            alt=""
          />
        </NuxtLink>

        <NuxtLink to="/#">
          <img
            class="mx-6 h-auto w-[130px] grayscale transition-all hover:grayscale-0"
            src="https://cdn.worldvectorlogo.com/logos/university-of-surrey.svg"
            alt=""
          />
        </NuxtLink>

        <NuxtLink to="/#">
          <img
            class="mx-6 h-auto w-[130px] grayscale transition-all hover:grayscale-0"
            src="https://upload.wikimedia.org/wikipedia/commons/7/75/Caltech_Logo.svg"
            alt=""
          />
        </NuxtLink>

        <NuxtLink to="/#">
          <img
            class="mx-6 h-auto w-[130px] grayscale transition-all hover:grayscale-0"
            src="https://cdn.worldvectorlogo.com/logos/university-of-bristol-1.svg"
            alt=""
          />
        </NuxtLink>

        <NuxtLink to="/#">
          <img
            class="mx-6 h-auto w-[130px] grayscale transition-all hover:grayscale-0"
            src="https://cdn.worldvectorlogo.com/logos/the-university-of-sydney-3.svg"
            alt=""
          />
        </NuxtLink>

        <NuxtLink to="/#">
          <img
            class="mx-6 h-auto w-[130px] grayscale transition-all hover:grayscale-0"
            src="https://cdn.worldvectorlogo.com/logos/the-university-of-chicago.svg"
            alt=""
          />
        </NuxtLink>

        <NuxtLink to="/#">
          <img
            class="mx-6 h-auto w-[130px] grayscale transition-all hover:grayscale-0"
            src="https://cdn.worldvectorlogo.com/logos/the-university-of-arizona.svg"
            alt=""
          />
        </NuxtLink>

        <NuxtLink to="/#">
          <img
            class="mx-6 h-auto w-[130px] grayscale transition-all hover:grayscale-0"
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Missouri_State_University.svg/1024px-Missouri_State_University.svg.png"
            alt=""
          />
        </NuxtLink>

        <NuxtLink to="/#">
          <img
            class="mx-6 h-auto w-[130px] grayscale transition-all hover:grayscale-0"
            src="https://cdn.worldvectorlogo.com/logos/northwestern-university.svg"
            alt=""
          />
        </NuxtLink>
      </Vue3Marquee>
    </div>
  </main>
</template>
