// 导入路由函数。
import {createRouter, createWebHistory} from 'vue-router'

import PublicLayout from "../layouts/PublicLayout.vue"

import HomeView from "../views/HomeView.vue";
import DubbingView from "../views/DubbingView.vue";
import CloneView from "../views/CloneView.vue";
import HistoryView from "../views/HistoryView.vue";
import TechingView from "../views/TechingView.vue";
import CommunityView from "../views/CommunityView.vue";
import HelpView from "../views/HelpView.vue";
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import RePasswordView from '../views/RePasswordView.vue';
import UserInfoView from '../views/User/UserInfo.vue';
import HistoryWorksView from '../views/User/HistoryWorks.vue';
import InteractionView from '../views/User/InteractionView.vue';
import NotificationView from '../views/User/NotificationView.vue';
import AudioRecordView from '../views/AudioRecordView.vue';



const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', redirect: '/Home' },
        // 官网布局（顶部导航+页脚）✅ 这个路由规则是独立的对象，必须有完整的{}包裹
        {
            path: '/', // 空路径，匹配所有子路由的公共父级
            component: PublicLayout,// ✅ 单个组件用单数 component
            children:[//✅ 写在当前路由对象内部 
                { path: '/home', name:'home', component: HomeView },
                { path: '/dubbing', name:'dubbing', component: DubbingView },
                { path: '/clone', name:'clone', component: CloneView },
                { path: '/history', name:'history', component: HistoryView },
                { path: '/teching', name:'teching', component: TechingView },
                { path: '/community', name:'community', component: CommunityView },
                { path: '/audio-record', name:'audio-record', component: AudioRecordView },
                { path: '/help',name:'help', component: HelpView },
                { path: '/login', name:'login', component: LoginView },
                { path: '/register', name:'register', component: RegisterView },
                { path: '/re-password', name:'re-password', component: RePasswordView },
                { path: '/user/info', name:'user-info', component: UserInfoView },
                { path: '/user/history', name:'history-works', component: HistoryWorksView },
                { path: '/user/interaction', name:'interaction', component: InteractionView },
                { path: '/user/notification', name:'notification', component: NotificationView },
                
            ]
        }
    ]
})

export default router

