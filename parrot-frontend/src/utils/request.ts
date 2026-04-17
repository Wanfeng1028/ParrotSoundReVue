import axios from 'axios';
import type {InternalAxiosRequestConfig, AxiosResponse, AxiosError  } from 'axios';
import { ElMessage } from 'element-plus';
//没有用到的暂时先给他注释掉
//import { AxiosInstance } from 'axios';
//import type { StringLiteral } from 'typescript';
//import { R } from 'vue-router/dist/router-CWoNjPRp.mjs';

//后端返回数据接口
//后端返回的数据类型是number类型的code，string类型的msg，data是泛型
interface ApiResponse<T = any> {
    code:number;
    msg:string;
    data:T;
}

//第一步，创建实例
const service  = axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 5000
})

//第二步,请求拦截器。拦截器api,接收的是两个函数:处理成功的函数和处理失败的函数
service.interceptors.request.use(
    (config:InternalAxiosRequestConfig) =>{
        const token = localStorage.getItem('token');
        if(token){
            //先把config.headers断言为非undefined类型
            config.headers = config.headers || {};
            config.headers.Authorization = token;
        }
        return config;
    },
    //失败处理函数
    (error:AxiosError) =>{
        return Promise.reject(error);
    }
    
)
//第三步,响应拦截器
service.interceptors.response.use(
    //respone是axios封装好的响应对象
    (response: AxiosResponse) => {
        const res = response.data as ApiResponse;
        if(res.code !== 200){
            ElMessage.error(res.msg || '请求出错');
            return Promise.reject(new Error(res.msg || '请求出错'));

    }
    return res as any;
    //不写as any的话会报错类型错误，就是说axios必须要你返回的是AxiosResponse类型的对象
},
    (error: any) => {
    console.error('网络错误:', error)
    console.error('网络错误:', error)
    // 给出统一的友好提示，而不是让页面直接报错。
    ElMessage.error(error.message || '请求失败')
    
    return Promise.reject(error)
    }
)


//导出
export default service as any;

