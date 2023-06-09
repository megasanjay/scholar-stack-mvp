<template>
  <main>
    <section
      class="container mx-auto flex flex-wrap items-center justify-center px-5 py-24"
    >
      <div class="flex w-full max-w-screen-sm flex-col items-center">
        <ClientOnly>
          <Vue3Lottie
            animation-link="https://assets4.lottiefiles.com/packages/lf20_rybr160z.json"
            :height="150"
            :width="150"
            :loop="1"
          />
        </ClientOnly>

        <h1 class="mb-6 mt-12 text-center text-2xl font-bold sm:text-4xl">
          Let's create a new account for you!
        </h1>

        <div
          class="mt-4 w-full max-w-sm space-y-6 rounded-lg border border-slate-200 bg-white px-4 py-6 shadow-md sm:px-8 sm:py-8"
        >
          <n-form
            ref="registerFormRef"
            :model="registerFormValue"
            :rules="registerFormRules"
            size="large"
          >
            <n-form-item path="emailAddress" label="Email Address">
              <n-input
                v-model:value="registerFormValue.emailAddress"
                placeholder="ea@sjy.so"
                @keydown.enter.prevent
              />
            </n-form-item>

            <n-form-item path="password" label="Password">
              <n-input
                v-model:value="registerFormValue.password"
                placeholder=""
                type="password"
                show-password-on="mousedown"
                @keydown.enter.prevent
              />
            </n-form-item>

            <div class="flex justify-center">
              <n-button
                type="primary"
                size="large"
                :loading="loading"
                @click="registerForAccount"
              >
                Register
              </n-button>
            </div>
          </n-form>

          <div class="flex justify-center text-sm">
            Already have an account?
            <nuxt-link
              class="ml-1 w-fit text-blue-600 transition-all hover:text-blue-400"
              to="/auth/login"
            >
              Login
            </nuxt-link>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { FormInst } from "naive-ui";
import isEmail from "validator/es/lib/isEmail";
import { useMessage } from "naive-ui";
const { auth } = useSupabaseAuthClient();
const user = useSupabaseUser();

const message = useMessage();
const loading = ref(false);

const registerFormRef = ref<FormInst | null>(null);

const registerFormValue = ref({
  emailAddress: "",
  password: "",
});

const registerFormRules = {
  emailAddress: {
    message: "Please input your email address",
    required: true,
    trigger: ["input"],
  },
  password: {
    message: "Please input your password",
    required: true,
    trigger: ["input"],
  },
};

const registerForAccount = (e: MouseEvent) => {
  e.preventDefault();

  registerFormRef.value?.validate(async (errors) => {
    if (!errors) {
      if (!isEmail(registerFormValue.value.emailAddress)) {
        message.error("Please enter a valid email address");
        return;
      }

      /**
       * TODO: Validate password strength
       */

      // register user
      loading.value = true;

      try {
        const { error } = await auth.signUp({
          email: registerFormValue.value.emailAddress,
          password: registerFormValue.value.password,
        });

        if (error) {
          throw error;
        }
      } catch (error) {
        console.error(error);
        message.error("Something went wrong. Please try again later.");
      }

      loading.value = false;

      // reset form
      registerFormValue.value.emailAddress = "";
      registerFormValue.value.password = "";

      console.log("success");

      // redirect to confirm email page
      return navigateTo("/auth/confirm-email");
    } else {
      console.log(errors);
    }
  });
};

watchEffect(() => {
  if (user.value) {
    return navigateTo("/");
  }
});
</script>
