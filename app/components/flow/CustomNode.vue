<script lang="ts" setup>
const props = defineProps({
  id: {
    required: true,
    type: String,
  },
  identifier: {
    required: true,
    type: String,
  },
  label: {
    required: true,
    type: String,
  },
  versionLabel: {
    required: true,
    type: String,
  },
});

function generateBrightColor() {
  const hue = Math.floor(Math.random() * 360); // 0 to 359
  const saturation = Math.floor(Math.random() * 25) + 75; // High saturation for vividness
  const lightness = Math.floor(Math.random() * 15) + 40; // Medium lightness for brightness

  return [
    `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    `hsl(${hue}, ${saturation}%, ${lightness}%, 0.1)`,
  ];
}

const [borderColor, backgroundColor] = generateBrightColor();

const navigateToResource = () => {
  const i = props.identifier;

  if (props.identifier) {
    const identifierType = i.split(":")[0];
    const identifier = i.substring(identifierType.length + 1);

    if (identifierType === "url") {
      navigateTo(identifier, {
        external: true,
        open: {
          target: "_blank",
        },
      });
    } else {
      navigateTo(`https://identifiers.org/${identifierType}:${identifier}`, {
        external: true,
        open: {
          target: "_blank",
        },
      });
    }
  }
};
</script>

<template>
  <div
    class="flex h-full max-w-[200px] flex-col gap-3 rounded border border-solid bg-white p-4 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md"
    :style="{
      borderColor,
      backgroundColor,
    }"
    @dblclick="navigateToResource()"
  >
    <span class="text-center text-xs">
      {{ label }}
      <span v-if="versionLabel" class="text-[8px]"> {{ versionLabel }} </span>
    </span>
  </div>
</template>
