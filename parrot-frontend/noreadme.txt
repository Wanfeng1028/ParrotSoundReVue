1.componments是可复用的组件。每个页面里面都需要用到的组件
2.views是页面组件。写页面的。
3.跳转页面，routerlink只切换组件，不刷新页面
<a href="/home"> 会导致页面整页刷新（像传统网站）
<RouterLink to="/home"> 是单页应用跳转：不刷新页面，只切换组件（这就是 Vue 的优势）