<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import { useQRCode } from "@vueuse/integrations/useQRCode";

const props = defineProps({
  collectionIdentifier: {
    required: true,
    type: Number,
  },
  selectedVersionIdentifier: {
    required: true,
    type: Number,
  },
  versions: {
    required: true,
    type: Array as PropType<Version[]>,
  },
});

const toast = useToast();

const qrcode = useQRCode(
  `https://sciconnect.io/view/c${props.collectionIdentifier}`,
);
const showCollectionIdentifierQRCodeModal = ref(false);

const handleDownloadQRCode = () => {
  console.log(qrcode.value);

  // image data is in the format "data:image/png;base64,...."

  const a = document.createElement("a");

  a.download = "QRCode.png";
  a.href = qrcode.value;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const copyToClipboard = (input: string) => {
  console.log("Copying to clipboard", input);
  const source = input;

  const { copied, copy, isSupported } = useClipboard({ source });

  if (!isSupported) {
    toast.add({
      title: "The Clipboard API is not supported by your browser",
      color: "error",
      description: "Please use a different browser",
      icon: "material-symbols:error",
    });
  }

  copy(source);

  if (copied) {
    toast.add({
      title: "URL copied to clipboard",
      color: "success",
      description: "The URL has been copied to your clipboard",
      icon: "material-symbols:check-circle",
    });
  }
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <UAlert title="Info" color="info" icon="i-lucide-terminal" variant="soft">
      <template #description>
        <div class="flex items-center justify-between gap-5">
          <p class="text-md text-slate-700 dark:text-slate-400">
            If you want to always link to the latest version, use the
            <NuxtLink
              :to="`/view/c${collectionIdentifier}`"
              class="text-sky-500 transition-all hover:text-sky-400"
            >
              c{{ collectionIdentifier }}</NuxtLink
            >
            identifier.
          </p>

          <div class="flex gap-2">
            <UModal v-model="showCollectionIdentifierQRCodeModal">
              <UButton
                color="neutral"
                variant="subtle"
                size="xs"
                icon="fluent:qr-code-20-regular"
              />

              <template #content>
                <UCard>
                  <div class="flex w-full items-center justify-center">
                    <img id="qr-code" :src="qrcode" alt="QR Code" />
                  </div>

                  <template #footer>
                    <div class="flex w-full items-center justify-center">
                      <UButton
                        label="Download QR Code"
                        color="neutral"
                        variant="subtle"
                        icon="fluent:qr-code-20-regular"
                        @click="handleDownloadQRCode"
                      />
                    </div>
                  </template>
                </UCard>
              </template>
            </UModal>

            <UPopover mode="hover">
              <UButton
                color="neutral"
                variant="subtle"
                icon="solar:copy-bold"
                size="xs"
                @click="
                  copyToClipboard(
                    `https://scholarstack.io/view/${collectionIdentifier}`,
                  )
                "
              />

              <template #content>
                <span class="px-2 py-1 text-sm">
                  Copy this URL to your clipboard.
                </span>
              </template>
            </UPopover>
          </div>
        </div>
      </template>
    </UAlert>

    <div class="flex flex-col">
      <div
        v-for="version in versions"
        :key="version.id"
        class="border-b border-stone-200 px-3 py-3"
        :class="{
          'rounded-md border border-stone-200 bg-stone-50':
            version.id === selectedVersionIdentifier,
        }"
      >
        <div class="flex items-center justify-between">
          <div class="flex flex-col">
            <div class="flex gap-3">
              <NuxtLink
                :to="`/view/v${version.id}`"
                class="text-base text-sky-500 transition-all hover:text-sky-400"
              >
                Version {{ version.name }}
              </NuxtLink>
            </div>

            <NuxtLink
              :to="`/view/v${version.id}`"
              class="text-sm transition-all hover:text-slate-400 hover:underline"
              :class="{
                'text-stone-600 dark:text-stone-600':
                  version.id === selectedVersionIdentifier,
                'text-stone-500 dark:text-stone-400':
                  version.id !== selectedVersionIdentifier,
              }"
            >
              v{{ version.id }}
            </NuxtLink>
          </div>

          <div class="flex flex-col items-end gap-1">
            <UPopover mode="hover">
              <UButton
                color="neutral"
                variant="subtle"
                size="xs"
                icon="solar:copy-bold"
                @click="
                  copyToClipboard(`https://sciconnect.io/view/v${version.id}`)
                "
              />

              <template #content>
                <span class="px-2 py-1 text-sm">
                  Copy this URL to your clipboard.
                </span>
              </template>
            </UPopover>

            <time
              class="text-sm"
              :class="{
                'text-stone-900': version.id === selectedVersionIdentifier,
                'text-stone-5 0': version.id !== selectedVersionIdentifier,
              }"
            >
              {{ displayStandardDate(version.publishedOn as string) }}
            </time>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
