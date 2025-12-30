// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: "SciConnect",
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
      ],
    },
    layoutTransition: { name: "layout", mode: "out-in" },
    pageTransition: { name: "page", mode: "out-in" },
  },
  compatibilityDate: "2025-01-16",
  css: [
    "~/assets/css/main.css",
    "@vue-flow/core/dist/style.css",
    "@vue-flow/core/dist/theme-default.css",
  ],
  devtools: { enabled: true },

  modules: [
    "@nuxt/ui",
    "nuxt-auth-utils",
    "dayjs-nuxt",
    "@pinia/nuxt",
    "@nuxt/image",
    "@nuxt/eslint",
  ],

  runtimeConfig: {
    public: {
      ENABLE_RESOURCES_SUBTYPE: process.env.FLAGS_ENABLE_RESOURCE_SUBTYPE
        ? process.env.FLAGS_ENABLE_RESOURCE_SUBTYPE === "true"
        : false,
    },
  },
  vite: {
    server: {
      hmr: {
        overlay: false,
      },
    },
  },
});
