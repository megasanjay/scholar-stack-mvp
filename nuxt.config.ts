// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  alias: {},

  app: {
    head: {
      title: "Scholar Stack",
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

  colorMode: {
    preference: "light",
  },

  css: [
    "@/assets/css/tailwind.css",
    "notivue/notifications.css",
    "notivue/animations.css",
    "@vue-flow/core/dist/style.css",
    "@vue-flow/core/dist/theme-default.css",
  ],

  devtools: {
    enabled: true,
  },

  image: {
    domains: ["api.dicebear.com"],
  },

  imports: {
    dirs: ["stores"],
  },

  modules: [
    "@nuxtjs/supabase",
    "@pinia/nuxt",
    "notivue/nuxt",
    "nuxt-headlessui",
    "@nuxt/ui",
    "dayjs-nuxt",
    [
      "@nuxtjs/google-fonts",
      {
        families: {
          Inter: true,
        },
      },
    ],
    "@nuxt/devtools",
    "@bg-dev/nuxt-naiveui",
    "@nuxt/image",
  ],

  naiveui: {
    colorModePreference: "light",
    iconSize: 18,
    themeConfig: {},
  },

  nitro: {},

  notivue: {
    // Options
  },

  runtimeConfig: {
    // Keys within public, will be also exposed to the client-side
    public: {},
    // The private keys which are only available within server-side
    UPLOAD_TOKEN_SECRET: process.env.UPLOAD_TOKEN_SECRET,
  },

  supabase: {
    redirectOptions: {
      callback: "/dashboard",
      cookieRedirect: false,
      exclude: ["/", "/register", "/view", "/view/*"],
      login: "/login",
    },
  },
});
