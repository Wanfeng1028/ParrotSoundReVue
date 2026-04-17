// src/views/Register/useRegisterLogic.ts
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '../api/auth' // 引入刚才写的登录接口


const useLoginLogic = () =>{
    const router = useRouter()
    const loading = ref(false) //按钮的加载状态
    //点击登录之后把按钮锁住，防止向后端过多发送请求
    
    const loginForm = reactive({
        email:'',
        password:''
    })
    const hanadleLogin = async () => {
        //前端校验，没有填写就不发送请求
        if(!loginForm.email || !loginForm.password){
            ElMessage.error('请填写邮箱和密码')
            return
        }
        loading.value = true;
        try {
            const res = await login(loginForm)
            ElMessage.success('登录成功')
            localStorage.setItem('token',res.data.token)
            //登录成功后跳转到首页
            router.push('/')

        }
        catch (error: any) {
            ElMessage.error('登录失败，请稍后重试:' + (error instanceof Error ? error.message : error))
        }
        //ts里面error的类型通常是undefined或者any类型
        finally {
            loading.value = false;
        }
    }

    return {
        loading,
        loginForm,
        hanadleLogin
    }

}
export { useLoginLogic }
