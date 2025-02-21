export default defineAppConfig({
  ui: {
    button: {
      defaultVariants: {
        size: "lg",
      },
      slots: {
        base: "cursor-pointer w-max",
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
