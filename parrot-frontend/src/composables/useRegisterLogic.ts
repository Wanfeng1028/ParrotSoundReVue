import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { sendCodeApi, registerApi } from '../api/auth' // 引入注册和发送验证码接口
//import type { un } from 'vue-router/dist/router-CWoNjPRp.mjs'

const useRegisterLogic = () =>{
    const router = useRouter()
    const loading = ref(false)//按钮是加载的状态
    const isCounting = ref(false)//是否正在倒计时
    const count = ref(60)//倒计时的秒数
    const registerForm = reactive({
        email:'',
        username:'',
        confirmPassword:'',
        password:'',
        code:''
    })
    // async 告诉程序：这个函数里有“慢动作”
    //异步函数
    const hanadleSendCode = async() =>{
        if(!registerForm.email){
            ElMessage.warning('请输入邮箱地址')
            return
        }
        try{
            await sendCodeApi({ email: registerForm.email })
            ElMessage.success('验证码发送成功，请查收邮箱')
            isCounting.value = true
            const timer = setInterval(() => {
                count.value--
                if (count.value <= 0) {
                    clearInterval(timer)
                    isCounting.value = false
                    count.value = 60
                }
            }, 1000)
        }
        catch(error:unknown){
            //错误处理
            const message = error instanceof Error ? error.message : String(error);
            ElMessage.error(`验证码发送失败，请稍后重试 ${message}`)
        }

    }
    const hanadleRegiter = async() =>{
        if(!registerForm.email || !registerForm.password || !registerForm.code || !registerForm.confirmPassword){
            ElMessage.warning('请填写完整信息')
            return
        }
        if(registerForm.password !== registerForm.confirmPassword){
            ElMessage.warning('两次输入的密码不一致')
            return
        }
        loading.value = true
        try{
            await registerApi(registerForm as {email:string,code:string,password:string})
            ElMessage.success('注册成功！')
            router.push('/login') // 注册成功去登录页
        }
        catch(error:unknown){
            const message = error instanceof Error ? error.message : String(error);
            ElMessage.error(`注册失败，请稍后重试 ${message}`)
        }
        finally{
            loading.value = false
        }

    }
    return{ loading,isCounting,count,registerForm,hanadleSendCode,hanadleRegiter }

}
export { useRegisterLogic }