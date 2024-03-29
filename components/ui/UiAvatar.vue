<script setup>
const runtimeConfig = useRuntimeConfig();
const props = defineProps(["path"]);
const { path } = toRefs(props);

const emit = defineEmits(["update:path", "upload"]);

const supabase = useSupabaseClient();

const uploading = ref(false);
const src = ref("");
const files = ref();

console.log("Path", path.value);

const downloadImage = async () => {
  try {
    // if (!path.value) return;

    // get public url
    const { error, publicURL } = await supabase.storage
      .from("avatars")
      .getPublicUrl(path.value, {
        download: true,
      });

    console.log("Path", path.value);
    console.log("Public URL", publicURL);
    console.log("Error", error);

    if (error) throw error;

    const publ = `${runtimeConfig.public.SUPABASE_URL}/storage/v1/object/public/avatars/${path.value}`;

    src.value = publ;

    // const { data, error } = await supabase.storage
    //   .from("avatars")
    //   .download(path.value);
    // if (error) throw error;
    // src.value = URL.createObjectURL(data);
  } catch (error) {
    console.error("Error downloading image: ", error.message);
  }
};

const uploadAvatar = async (evt) => {
  files.value = evt.target.files;
  try {
    uploading.value = true;

    if (!files.value || files.value.length === 0) {
      throw new Error("You must select an image to upload.");
    }

    const file = files.value[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    // const filePath = `${fileName}`;
    const filePath = path.value;

    // delete old avatar
    // const { error: deleteError } = await supabase.storage
    //   .from("avatars")
    //   .remove([path.value]);

    // if (deleteError) throw deleteError;

    // const { error: uploadError } = await supabase.storage
    //   .from("avatars")
    //   .upload(filePath, file);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .update(filePath, file, {
        // cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    emit("update:path", filePath);
    emit("upload");
  } catch (error) {
    alert(error.message);
  } finally {
    uploading.value = false;
  }
};

downloadImage();

watch(path, () => {
  if (path.value) {
    downloadImage();
  }
});
</script>

<template>
  <div>
    <pre>
      {{ path }} {{ src }}
    </pre>

    <img
      v-if="src"
      :src="src"
      alt="Avatar"
      class="avatar image"
      style="width: 10em; height: 10em"
    />

    <div v-else class="avatar no-image" />

    <div style="width: 10em; position: relative">
      <label class="button primary block" for="single">
        {{ uploading ? "Uploading ..." : "Upload" }}
      </label>

      <input
        id="single"
        style="position: absolute; visibility: hidden"
        type="file"
        accept="image/*"
        :disabled="uploading"
        @change="uploadAvatar"
      />
    </div>
  </div>
</template>
