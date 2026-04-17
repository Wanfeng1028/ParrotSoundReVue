import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'//导入enelmentplus组件库的所有模块和功能
import 'element-plus/dist/index.css'//导入element-plus的默认样式表，全局样式
import * as ElementPlusIconsVue from '@element-plus/icons-vue'//导入element-plus的图标组件库
import './main.css'//导入全局样式表
import './style.css'//导入全局样式表

import App from './App.vue'
// 注意：如果现在还没创建 router 文件，先注释掉下面这行，稍后我们再加
import router from './router' 

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(ElementPlus)
app.use(router)
// 挂载应用到 DOM 元素 #app 上
app.mount('#app')