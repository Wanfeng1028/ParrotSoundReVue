// 登录接口的地址是什么，需要传什么参数

//引入封装的请求工具
import request from "../utils/request";

//定义登录参数的类型契约
export interface LoginParams {
    email:string;
    password:string;
}
//定义登录接口函数
const login = (data: LoginParams) =>{
    return request({
        url:'/api/login',// 接口路径（会自动拼在 baseURL 后面）
        method:'POST',// 登录通常使用 POST 请求，因为要加密传输密码
        data// 这里放的就是 email 和 password
    })
}
//定义发送验证码接口函数
const sendCodeApi = (data:{email:string}) =>{
    return request({
        url:'/api/sendCode',
        method:'POST',
        data
    })
}
//定义注册接口函数
const registerApi = (data:{email:string,code:string,password:string}) =>{
    return request({
        url:'/api/register',
        method:'POST',
        data
    })
}
//导出接口函数
export {
    login,
    sendCodeApi,
    registerApi
}
