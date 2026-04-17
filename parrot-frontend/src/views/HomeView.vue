<template>
  <!-- 第一屏幕 -->
  <section class="section-box">
    <!-- 背景图 -->
    <div class="home-banner">
      <picture>
        <source :srcset="bannerImageWebp" type="image/webp" />
        <img
          class="home-banner__img"
          :src="bannerImageJpg"
          alt="首页背景图"
          fetchpriority="high"
        />
      </picture>
    </div>
    <!-- 文字内容 -->
    <div class="home-banner__content">
      <h1 class="home-banner__title">{{ text }}</h1>
      <p class="home-banner__description">
        打造数字语音课程，PPT转视频，个性化语音合成等。<br />
        提供智能配音、声音克隆、教育教学等服务，帮助用户实现语音定制化需求。
      </p>
      <el-button class="home-banner__btn" type="primary" @click="handleStartUsing">
        开始使用
      </el-button>
      <el-button class="home-banner__btn" type="default" @click="handleLearnMore">
        了解更多
      </el-button>
    </div>
  </section>
  <!-- 第二屏幕 -->
  <section class="section-box">
    <div class="bg-wrapper">
      <picture>
        <source :srcset="techBannerWebp" type="image/webp" />
        <img
          class="home-banner__img"
          :src="techBannerPng"
          alt="技术背景图"
          loading="lazy"
        />
      </picture>
    </div>

    <div class="section-two__content">
      <h1 class="title-tech">{{ title }}<span class="cursor">|</span></h1>
    </div>
  </section>
  <!-- 第三屏幕 -->
  <section class="section-box section-three-bg">
    <div class="section-three__header">
      <h1 class="title-tech-three">
        {{ titleThree }}<span class="cursor">|</span>
      </h1>
    </div>

    <div class="cards-container">
      <el-row :gutter="40">
        <!-- 现场录音功能 -->
        <el-col :span="12" class="grid-col">
          <div class="tech-item">
            <div class="img-box">
              <picture>
                <source :srcset="techCardOne.webp" type="image/webp" />
                <img :src="techCardOne.png" alt="现场录音功能" loading="lazy" />
              </picture>
            </div>
            <div class="tech-item__footer">现场录音功能</div>
          </div>
        </el-col>
        <!-- 标准音频预设 -->
        <el-col :span="12" class="grid-col">
          <div class="tech-item">
            <div class="img-box">
              <picture>
                <source :srcset="techCardTwo.webp" type="image/webp" />
                <img :src="techCardTwo.png" alt="标准音频预设" loading="lazy" />
              </picture>
            </div>
            <div class="tech-item__footer">标准音频预设</div>
          </div>
        </el-col>
      </el-row>
      <!-- 定制化语音讲解 -->
      <el-row :gutter="40">
        <el-col :span="12" class="grid-col">
          <div class="tech-item">
            <div class="img-box">
              <picture>
                <source :srcset="techCardThree.webp" type="image/webp" />
                <img :src="techCardThree.png" alt="定制化语音讲解" loading="lazy" />
              </picture>
            </div>
            <div class="tech-item__footer">定制化语音讲解</div>
          </div>
        </el-col>
        <!-- 音频文件上传 -->
        <el-col :span="12" class="grid-col">
          <div class="tech-item">
            <div class="img-box">
              <picture>
                <source :srcset="techCardFour.webp" type="image/webp" />
                <img :src="techCardFour.png" alt="音频文件上传" loading="lazy" />
              </picture>
            </div>
            <div class="tech-item__footer">音频文件上传</div>
          </div>
        </el-col>
      </el-row>
    </div>
  </section>
  <!-- 第四屏幕 -->
  <section class="section-box section-three-bg">
    <div class="section-four__header">
      <h2 class="title-tech-four">
        {{ titleFour }}<span class="cursor">|</span>
      </h2>
    </div>

    <div class="carousel-container">
      <el-carousel
        :interval="4000"
        type="card"
        height="400px"
        indicator-position="outside"
      >
        <el-carousel-item v-for="(item, index) in carouselItems" :key="index">
          <div class="custom-card">
            <div class="card-header">{{ item.title }}</div>

            <div class="card-img-box">
              <picture>
                <source :srcset="item.webp" type="image/webp" />
                <img :src="item.img" :alt="item.title" loading="lazy" />
              </picture>
            </div>

            <div class="card-desc">
              <p>{{ item.desc }}</p>
            </div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>
  </section>
  <!-- 底部介绍屏幕 -->
  <footer class="site-footer">
    <div class="footer-content">
      <div class="footer-left">
        <div class="logo-box">
          <img
            src="../assets/images/logo.png"
            alt="Parrot Sound"
            class="footer-logo"
          />
        </div>
      </div>

      <div class="footer-center">
        <div class="footer-column">
          <h4>产品服务</h4>
          <ul>
            <li><router-link to="/dubbing">智能配音</router-link></li>
            <li><router-link to="/clone">声音克隆</router-link></li>
            <li><router-link to="/teching">教育教学</router-link></li>
          </ul>
        </div>
        <div class="footer-column">
          <h4>关于我们</h4>
          <ul>
            <li><router-link to="/help">意见反馈</router-link></li>
            <li><router-link to="/help">使用帮助</router-link></li>
          </ul>
        </div>
      </div>

      <div class="footer-right">
        <h4>关注我们</h4>
        <div class="social-icons">
          <!-- <div class="icon-item"><img src="../assets/icons/log-1.svg" alt="官网" /></div> -->
          <div class="icon-item">
            <img src="../assets/icons/instagram.svg" alt="Ins" />
          </div>
          <!-- <div class="icon-item"><img src="../assets/icons/Twitter.svg" alt="Twitter" /></div> -->
          <div class="icon-item">
            <img src="../assets/icons/微信.svg" alt="微信" />
          </div>
          <div class="icon-item">
            <img src="../assets/icons/微博.svg" alt="微博" />
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <p>©2025 产品版权所有 备案号xxxxxxxx</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useTypeWriter } from "../composables/HomeTpyeWriter.ts";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const bannerImageWebp = new URL("../assets/images/banner-computer.webp", import.meta.url).href;
const bannerImageJpg = new URL("../assets/images/banner-computer.jpg", import.meta.url).href;
const techBannerWebp = new URL("../assets/images/tech-banner.webp", import.meta.url).href;
const techBannerPng = new URL("../assets/images/tech-banner.png", import.meta.url).href;
const techCardOne = {
  webp: new URL("../assets/images/tech-1.webp", import.meta.url).href,
  png: new URL("../assets/images/tech-1.png", import.meta.url).href,
};
const techCardTwo = {
  webp: new URL("../assets/images/tech-2.webp", import.meta.url).href,
  png: new URL("../assets/images/tech-2.png", import.meta.url).href,
};
const techCardThree = {
  webp: new URL("../assets/images/tech-3.webp", import.meta.url).href,
  png: new URL("../assets/images/tech-3.png", import.meta.url).href,
};
const techCardFour = {
  webp: new URL("../assets/images/tech-4.webp", import.meta.url).href,
  png: new URL("../assets/images/tech-4.png", import.meta.url).href,
};

const { text } = useTypeWriter("鹦音坊--AI语音平台", 100, 500);
const { text: title } = useTypeWriter("强大的核心技术", 150, 1000); // 稍微晚一点开始
const { text: titleThree } = useTypeWriter(
  "超越文本转语音和语音转文本，教育教学资源丰富，社区互动性强。",
  150,
  1000,
);
const { text: titleFour } = useTypeWriter(
  "专业版功能更加强大，支持有声课件制作等更多定制化需求。",
  150,
  1000,
);

const carouselItems = [
  {
    title: "声音置换与字幕",
    img: new URL("../assets/images/course-1.png", import.meta.url).href, // 示例图片路径写法
    webp: new URL("../assets/images/course-1.webp", import.meta.url).href,
    desc: "自动识别语音内容并生成字幕，支持多语种声音一键置换，保留原视频背景音。",
  },
  {
    title: "3D数字人",
    img: new URL("../assets/images/course-2.png", import.meta.url).href,
    webp: new URL("../assets/images/course-2.webp", import.meta.url).href,
    desc: "高精度3D虚拟数字人形象，支持表情驱动与动作捕捉，打造沉浸式教学体验。",
  },
  {
    title: "语音合成",
    img: new URL("../assets/images/course-3.png", import.meta.url).href,
    webp: new URL("../assets/images/course-3.webp", import.meta.url).href,
    desc: "依托语音生成、数字人讲解及多模态内容生成，全面支持教师与学生的互动式学习需求，满足基础配音功能。",
  },
  {
    title: "声音克隆",
    img: new URL("../assets/images/course-4.png", import.meta.url).href,
    webp: new URL("../assets/images/course-4.webp", import.meta.url).href,
    desc: "只需少量音频数据即可快速克隆目标声音，还原度高，适用于个性化配音场景。",
  },
  {
    title: "有声课件",
    img: new URL("../assets/images/course-5.png", import.meta.url).href,
    webp: new URL("../assets/images/course-5.webp", import.meta.url).href,
    desc: "将传统PPT快速转化为带有智能配音的有声视频课件，提升教学资源制作效率。",
  },
];

const handleStartUsing = () => {
  router.push(authStore.isLoggedIn ? "/dubbing" : "/login");
};

const handleLearnMore = () => {
  router.push("/help");
};
</script>

<style scoped>
/* 公共样式 */
/* 每一个屏幕的容器 */
.section-box {
  position: relative; /* 核心：作为子元素绝对定位的参考点 */
  width: 100%;
  height: calc(100vh - 60px);
  overflow: hidden;
}
.bg-all {
  position: fixed;
  inset: 0; /* 等价于 top:0 right:0 bottom:0 left:0 */
  width: 100vw;
  height: 100vh;
  background: linear-gradient(
    90deg,
    rgba(173, 178, 219, 0.81) 0%,
    rgba(227, 229, 250, 1) 100%
  );
  filter: blur(6px);
  z-index: -1; /* ✅ 背景永远在最底层 */
}
/* 第一屏幕 */
.home-banner {
  width: 100%;
  /* 这里的计算是正确的，但要配合 body margin:0 才能完美 */
  height: calc(100vh - 60px);

  /* 移除冗余的margin-top，因为PublicLayout.vue已经设置了padding-top: 60px */
  margin-top: 0;

  overflow: hidden;
}
.home-banner__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block; /* 必须是 block，否则图片底部会有几像素默认留白 */
}
.home-banner__btn {
  width: 120px; /* 让按钮宽一点，更大气 */
  height: 40px; /* 让按钮高一点 */
  margin-right: 20px; /* 让两个按钮之间拉开距离！关键！ */
  font-size: 16px; /* 字号改大 */
}
/* 文案层 */
.home-banner__content {
  position: absolute; /* 将其固定 */
  top: 50%;
  left: 12%;
  transform: translateY(-50%);
  max-width: 12200px;
  z-index: 10; /* 确保内容位于顶部 */
}
.home-banner__title {
  background: linear-gradient(45deg, #bbc0df, #4754a6);
  -webkit-background-clip: text;
  background-clip: text;
  font-size: 88px;
  font-weight: 700;
  color: transparent;
  margin: 0 0 14px;
}
.home-banner__description {
  font-size: 30px;
  color: #818ee4;
  margin: 0 0 24px;
}
/* 打字机光标闪烁动画 */
.home-banner__title::after {
  content: "|";
  color: #1b1b1b;
  animation: blink 1s step-end infinite;
}

/* 第二屏幕 */

.section-two__content {
  position: absolute;
  /* 绝对定位居中大法 */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  text-align: center;
  width: 100%; /* 防止文字换行 */
}

.title-tech {
  /* 字体变大 */
  font-size: 128px;
  font-weight: 800;
  /* 加上字间距更好看 */
  letter-spacing: 4px;

  /* 渐变色文字效果（可选，像科技感） */
  background: linear-gradient(45deg, #bbc0df, #4754a6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  /* 如果不支持渐变，回退颜色 */
  /* color: #1b1b1b; */
}
/* 第三屏幕 */
/* 第三屏幕背景（可选，白色显得干净） */
.section-three-bg {
  background-color: #fbfbfc;
}

/* --- 标题区域 --- */
.section-three__header {
  position: absolute;
  top: 2%; /* 距离顶部 10% */
  left: 0;
  width: 100%;
  text-align: center;
  z-index: 10;
}

.title-tech-three {
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 2px;
  /* 渐变色标题 */
  background: linear-gradient(45deg, #bbc0df, #4754a6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* --- 卡片容器布局 --- */
.cards-container {
  position: absolute;
  /* 让容器位于标题下方，垂直居中偏下的位置 */
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);

  /* 限制容器总宽度，防止卡片在超大屏幕上拉得太长 */
  width: 1000px;
  max-width: 90%;
  z-index: 10;
}

/* 给每一列增加下边距，这样第一行和第二行之间会有空隙 */
.grid-col {
  margin-bottom: 30px;
}

/* --- 单个卡片样式 --- */
.tech-item {
  position: relative;
  border-radius: 12px; /* 圆角 */
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); /* 阴影 */
  background-color: #fff;
  cursor: pointer;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  height: 260px; /* 固定卡片高度，保证整齐 */
  display: flex;
  flex-direction: column;
}

/* 悬停效果：轻微上浮 */
.tech-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
}

/* 图片容器 */
.img-box {
  flex: 1; /* 占据除了底部文字条之外的所有空间 */
  width: 100%;
  overflow: hidden;
}

.img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保证图片铺满且不变形 */
  transition: transform 0.5s ease;
}

/* 悬停时图片轻微放大 */
.tech-item:hover .img-box img {
  transform: scale(1.05);
}

/* 底部文字条 (还原图片中的紫色条) */
.tech-item__footer {
  height: 50px; /* 文字条高度 */
  line-height: 50px;
  /* 使用你图片风格的蓝紫色背景 */
  background: linear-gradient(90deg, #bbc0df, #4754a6);
  color: #fff;
  text-align: center;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 1px;
}
/* 第四屏幕 */
/* 背景色：浅灰/浅蓝，为了衬托白色卡片 */
.section-four-bg {
  background-color: #f5f7fa;
}

/* 标题区域 */
.section-four__header {
  text-align: center;
  padding-top: 40px; /* 距离顶部留空 */
  margin-bottom: 40px;
}

.title-tech-four {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: 2px;
  background: linear-gradient(45deg, #bbc0df, #4754a6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* 轮播图容器限制宽度 */
.carousel-container {
  width: 1200px;
  max-width: 95%;
  margin: 0 auto; /* 居中 */
}

/* === 卡片内部样式 === */
.custom-card {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 12px;
  overflow: hidden; /* 圆角裁剪 */
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative; /* 为绝对定位的描述层做参照 */
}

/* 卡片标题 */
.card-header {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

/* 图片区域 */
.card-img-box {
  flex: 1;
  width: 100%;
  overflow: hidden;
  background: #fff;
}

.card-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保持比例填满 */
  display: block;
}

/* === 底部描述层 (核心逻辑) === */
.card-desc {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 140px; /* 描述层高度 */
  padding: 20px;
  box-sizing: border-box;

  /* 默认状态：透明/隐藏，或者白色背景 */
  background: rgba(255, 255, 255, 0.9);
  opacity: 0; /* 默认隐藏文字 */
  transform: translateY(20px); /* 默认稍微往下沉一点 */
  transition: all 0.4s ease; /* 动画过渡 */

  display: flex;
  align-items: center;
  justify-content: center;
}

.card-desc p {
  font-size: 14px;
  line-height: 1.6;
  text-align: left;
  color: #fff; /* 字体白色 */
  margin: 0;
}

/* === Element Plus 激活状态覆盖 (Magic Happens Here) === */

/* 当该卡片是当前激活项 (中间那个) 时 */
.el-carousel__item.is-active .custom-card {
  box-shadow: 0 12px 32px rgba(83, 98, 188, 0.3); /* 加深阴影 */
}

/* 当该卡片激活时，让描述层显示出来，并变成紫色渐变背景 */
.el-carousel__item.is-active .card-desc {
  opacity: 1; /* 显示 */
  transform: translateY(0); /* 上浮归位 */

  /* 还原图片中的紫色渐变效果 */
  background: linear-gradient(
    180deg,
    rgba(135, 147, 240, 0.9) 0%,
    rgba(83, 98, 188, 0.95) 100%
  );
}

/* 非激活状态的卡片稍微变暗一点（可选） */
.el-carousel__item:not(.is-active) .custom-card {
  filter: grayscale(20%); /* 稍微置灰 */
  opacity: 0.9;
}

/* 光标动画 */
.cursor {
  font-weight: 100;
  margin-left: 5px;
  animation: blink 1s infinite;
}

/* Footer 整体容器 */
.site-footer {
  background-color: #fff;
  padding-top: 60px;
  width: 100%;
  /* 确保 footer 在最上面，如果前面的 section 有 z-index，这里可能需要调整 */
  position: relative;
  z-index: 10;
}

/* 内容区域布局：左中右三部分 */
.footer-content {
  width: 1200px;
  max-width: 90%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between; /* 两端对齐，中间留空 */
  align-items: flex-start; /* 顶部对齐 */
  padding-bottom: 50px;
}

/* === 左侧 Logo === */
.footer-left {
  flex: 1; /* 占用一部分空间 */
}

.footer-logo {
  height: 40px; /* 根据你的 Logo 实际尺寸调整 */
  display: block;
}

/* === 中间 链接组 === */
.footer-center {
  flex: 2;
  display: flex;
  justify-content: center; /* 居中显示 */
  gap: 100px; /* 两个列表之间的间距 */
}

.footer-column h4 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.footer-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-column ul li {
  margin-bottom: 12px;
}

.footer-column ul li a {
  font-size: 14px;
  color: #666;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-column ul li a:hover {
  color: #5362bc; /* 悬停变为主题色 */
}
/* 底部 */
/* === 右侧 社交图标 === */
.footer-right {
  flex: 1;
  text-align: left; /* 调整为左对齐或右对齐 */
  padding-left: 50px; /* 稍微往右推一点 */
}

.footer-right h4 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.social-icons {
  display: flex;
  gap: 15px; /* 图标之间的间距 */
}

.icon-item {
  width: 24px;
  height: 24px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.icon-item:hover {
  opacity: 1;
}

.icon-item img {
  width: 100%;
  height: 100%;
  display: block;
}

/* === 底部版权线 === */
.footer-bottom {
  border-top: 1px solid #eee; /* 浅灰色分割线 */
  text-align: center;
  padding: 20px 0;
  margin-top: 10px;
}

.footer-bottom p {
  font-size: 12px;
  color: #999;
  margin: 0;
}

/* 移动端适配 (可选) */
@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 40px;
  }

  .footer-center {
    gap: 50px;
  }

  .footer-right {
    padding-left: 0;
  }
}
</style>
