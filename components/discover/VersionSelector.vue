<script setup lang="ts">
import { useClipboard } from "@vueuse/core";

const showCollectionIdentifierQRCodeModal = ref(false);

defineProps({
  collectionIdentifier: {
    required: true,
    type: String,
  },
  selectedVersionIdentifier: {
    required: true,
    type: String,
  },
  versions: {
    required: true,
    type: Array as PropType<Version[]>,
  },
});

const handleDownloadQRCode = () => {
  const canvas = document
    .querySelector("#qr-code")
    ?.querySelector<HTMLCanvasElement>("canvas");
  if (canvas) {
    const url = canvas.toDataURL();
    const a = document.createElement("a");
    a.download = "QRCode.png";
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

const copyToClipboard = (input: string) => {
  console.log("Copying to clipboard", input);
  const source = input;

  const { copied, copy, isSupported } = useClipboard({ source });

  if (!isSupported) {
    push.error("The Clipboard API is not supported by your browser");
  }

  copy(source);

  if (copied) {
    push.success("Your URL was copied to the clipboard");
  }
};
</script>

<template>
  <div>
    <n-alert type="info" class="mb-5 mt-3" title="Info">
      <div class="flex items-center justify-between gap-5">
        <p class="text-base">
          If you want to always link to the latest version, use the
          <NuxtLink
            :to="`/view/${collectionIdentifier}`"
            class="text-sky-500 transition-all hover:text-sky-400"
          >
            {{ collectionIdentifier }}</NuxtLink
          >
          identifier.
        </p>

        <n-flex>
          <n-popover trigger="hover">
            <template #trigger>
              <n-button
                color="black"
                class="dark:text-white"
                @click="showCollectionIdentifierQRCodeModal = true"
              >
                <template #icon>
                  <Icon name="fluent:qr-code-20-regular" size="18" />
                </template>
              </n-button>
            </template>

            <span> Create a shareable QR code </span>
          </n-popover>

          <n-popover trigger="hover">
            <template #trigger>
              <n-button
                color="black"
                class="dark:text-white"
                @click="
                  copyToClipboard(
                    `https://scholarstack.io/view/${collectionIdentifier}`,
                  )
                "
              >
                <template #icon>
                  <Icon name="solar:copy-bold" size="18" />
                </template>
              </n-button>
            </template>

            <span> Copy this URL to your clipboard </span>
          </n-popover>

          <n-modal
            v-model:show="showCollectionIdentifierQRCodeModal"
            transform-origin="center"
          >
            <n-card
              style="width: 600px"
              :bordered="false"
              role="dialog"
              size="huge"
              aria-modal="true"
            >
              <n-space vertical align="center">
                <n-qr-code
                  id="qr-code"
                  :value="`https://scholarstack.io/view/${collectionIdentifier}`"
                  icon-src="/logo/logo.svg"
                  error-correction-level="Q"
                  :size="150"
                  class="!p-0"
                />

                <n-button @click="handleDownloadQRCode"> Download </n-button>
              </n-space>
            </n-card>
          </n-modal>
        </n-flex>
      </div>
    </n-alert>

    <div class="flex flex-col">
      <div
        v-for="version in versions"
        :key="version.id"
        class="rounded-md px-3 py-3"
        :class="{
          'border border-stone-200 bg-stone-50':
            version.identifier === selectedVersionIdentifier,
        }"
      >
        <n-flex justify="space-between">
          <n-flex vertical size="small">
            <n-flex>
              <NuxtLink
                :to="`/view/${version.identifier}`"
                class="text-base text-sky-500 transition-all hover:text-sky-400"
              >
                Version {{ version.name }}
              </NuxtLink>

              <n-popover trigger="hover">
                <template #trigger>
                  <n-button
                    size="small"
                    class="text-blue-500"
                    text
                    @click="
                      copyToClipboard(
                        `https://scholarstack.io/view/${version.identifier}`,
                      )
                    "
                  >
                    <template #icon>
                      <Icon name="solar:copy-bold" size="15" />
                    </template>
                  </n-button>
                </template>

                <span> Copy this URL to your clipboard </span>
              </n-popover>
            </n-flex>

            <NuxtLink
              :to="`/view/${version.identifier}`"
              class="text-sm transition-all hover:text-slate-400 hover:underline"
              :class="{
                'text-stone-600':
                  version.identifier === selectedVersionIdentifier,
                'text-stone-50':
                  version.identifier !== selectedVersionIdentifier,
              }"
            >
              {{ version.identifier }}
            </NuxtLink>
          </n-flex>

          <n-flex vertical size="small">
            <time
              class="text-sm"
              :class="{
                'text-stone-900':
                  version.identifier === selectedVersionIdentifier,
                'text-stone-5 0':
                  version.identifier !== selectedVersionIdentifier,
              }"
            >
              {{ displayStandardDate(version.published_on as string) }}
            </time>
          </n-flex>
        </n-flex>
      </div>
    </div>
  </div>
</template>
