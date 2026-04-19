import { reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../stores/auth";

export const useLoginLogic = () => {
  const router = useRouter();
  const route = useRoute();
  const authStore = useAuthStore();

  const loginForm = reactive({
    email: "",
    password: "",
  });

  const hanadleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      ElMessage.warning({
        message: "请填写邮箱和密码",
        grouping: true,
      });
      return;
    }
    await authStore.loginWithPassword(loginForm);
    ElMessage.success({
      message: "登录成功",
      grouping: true,
    });
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/dubbing";
    router.push(redirect);
  };

  const handleSocialLogin = async (provider: "google" | "facebook" | "microsoft" | "x" | "apple", label: string) => {
    await authStore.loginWithSocialProvider(provider);
    ElMessage.success({
      message: `${label}成功`,
      grouping: true,
    });
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/dubbing";
    router.push(redirect);
  };

  return {
    loading: authStore.loading,
    loginForm,
    hanadleLogin,
    handleSocialLogin,
    frontendDemoEnabled: authStore.frontendDemoEnabled,
    frontendDemoAccount: authStore.frontendDemoAccount,
  };
};
