<script setup>
const user = useSupabaseUser();
const supabase = useSupabaseClient();

const loading = ref(false);
const files = ref();

const src = ref(`https://sciconnect-test.b-cdn.net/avatar/${user.value.id}`);

const downloadImage = async () => {
  loading.value = true;

  try {
    const image = await fetch(src.value);
    const data = await image.blob();

    src.value = URL.createObjectURL(data);
  } catch (error) {
    src.value = `https://api.dicebear.com/6.x/thumbs/svg?seed=${user.value.id}`;
    console.error("Error downloading image: ", error.message);
  }

  loading.value = false;
};

const uploadAvatar = async (evt) => {
  files.value = evt.target.files;

  try {
    loading.value = true;

    if (!files.value || files.value.length === 0) {
      throw new Error("You must select an image to upload.");
    }

    const file = files.value[0];

    const fileName = user.value.id;
    const fileSize = file.size;
    const fileType = file.type;

    // Get the signed URL for uploading the file
    const data = await $fetch("/api/user/presign", {
      body: JSON.stringify({
        fileName,
        fileSize,
        fileType,
      }),
      headers: useRequestHeaders(["cookie"]),
      method: "POST",
    });

    const { signedUrl } = data;
    console.log("Signed URL: ", signedUrl);

    const formData = new FormData();

    formData.append("file", file);

    await $fetch(signedUrl, {
      body: formData,
      method: "POST",
    })
      .then(async () => {
        const { data: updatedUser, error: _updatedUserError } =
          await supabase.auth.updateUser({
            data: {
              avatar_url: `https://sciconnect-test.b-cdn.net/avatar/${user.value.id}`,
            },
          });

        console.log("Updated user: ", updatedUser);

        downloadImage();
      })
      .catch((error) => {
        console.error("Error uploading image: ", error.message);
        push.error({
          title: "Error",
          message: "Could not upload image. Please try again",
        });
      });
  } catch (error) {
    push.error({
      title: "Error",
      message: "Something went wrong. Please try again.",
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  downloadImage();
});
</script>

<template>
  <n-spin :show="loading">
    <div class="relative">
      <label class="" for="single">
        <n-avatar
          :src="src"
          :fallback-src="`https://api.dicebear.com/6.x/thumbs/svg?seed=${user.id}`"
          :size="100"
          alt="User Avatar"
          class="cursor-pointer transition-all hover:opacity-70"
          round
        />
      </label>

      <input
        id="single"
        style="position: absolute; visibility: hidden"
        type="file"
        accept="image/*"
        :disabled="loading"
        @change="uploadAvatar"
      />
    </div>
  </n-spin>
</template>
