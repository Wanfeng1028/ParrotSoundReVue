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
      ElMessage.warning("请填写邮箱和密码");
      return;
    }
    await authStore.loginWithPassword(loginForm);
    ElMessage.success("登录成功");
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/dubbing";
    router.push(redirect);
  };

  return {
    loading: authStore.loading,
    loginForm,
    hanadleLogin,
    frontendDemoAccount: authStore.frontendDemoAccount,
  };
};
