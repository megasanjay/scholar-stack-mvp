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
      neutral: "zinc",
      primary: "sky",
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
