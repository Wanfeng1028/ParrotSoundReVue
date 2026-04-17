import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "../stores/auth";

export const useRegisterLogic = () => {
  const router = useRouter();
  const authStore = useAuthStore();
  const isCounting = ref(false);
  const count = ref(60);
  const registerForm = reactive({
    email: "",
    username: "",
    confirmPassword: "",
    password: "",
    code: "",
  });

  const startCountdown = () => {
    isCounting.value = true;
    count.value = 60;
    const timer = window.setInterval(() => {
      count.value -= 1;
      if (count.value <= 0) {
        window.clearInterval(timer);
        isCounting.value = false;
        count.value = 60;
      }
    }, 1000);
  };

  const hanadleSendCode = async () => {
    if (!registerForm.email) {
      ElMessage.warning("请输入邮箱地址");
      return;
    }
    const response = await authStore.requestCode(registerForm.email);
    ElMessage.success(
      response.data.code
        ? `验证码已生成，开发模式验证码：${response.data.code}`
        : "验证码已发送，请查收邮箱",
    );
    startCountdown();
  };

  const hanadleRegiter = async () => {
    if (!registerForm.email || !registerForm.username || !registerForm.password || !registerForm.code) {
      ElMessage.warning("请填写完整信息");
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      ElMessage.warning("两次输入的密码不一致");
      return;
    }
    await authStore.registerAccount({
      email: registerForm.email,
      username: registerForm.username,
      password: registerForm.password,
      code: registerForm.code,
    });
    ElMessage.success("注册成功");
    router.push("/dubbing");
  };

  return {
    registerForm,
    isCounting,
    count,
    loading: authStore.loading,
    hanadleSendCode,
    hanadleRegiter,
  };
};
