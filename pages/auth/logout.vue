<script setup lang="ts">
definePageMeta({
  layout: "no-header",
});

const user = useSupabaseUser();
const supabase = useSupabaseClient();

console.log("Logging out");

if (!user) {
  navigateTo("/");
} else {
  console.log("Logging out");
  const { error } = await supabase.auth.signOut();
  if (error) console.log(error);
  navigateTo("/");
}
</script>

<template>
  <main class="flex h-full w-full items-center justify-center">
    <p>Logging out...</p>
  </main>
</template>
