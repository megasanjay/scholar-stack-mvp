export default defineAppConfig({
  ui: {
    button: {
      defaultVariants: {
        size: "lg",
      },
      slots: {
        base: "cursor-pointer",
      },
    },
    colors: {
      gray: "gray",
      neutral: "zinc",
      primary: "pink",
      slate: "slate",
      stone: "stone",
      white: "white",
      zinc: "zinc",
    },
    header: {
      slots: {
        root: "bg-default/75 backdrop-blur border-b border-default h-(--ui-header-height) static",
      },
    },
    input: {
      slots: {
        root: "w-full",
      },
    },
    textarea: {
      slots: {
        root: "w-full",
      },
    },
  },
});
