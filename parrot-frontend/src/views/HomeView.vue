<template>
  <div class="home-page">
    <section class="section-box section-box--hero">
      <div class="home-banner">
        <picture>
          <source :srcset="bannerImageWebp" type="image/webp" />
          <img class="home-banner__img" :src="bannerImageJpg" alt="首页背景图" fetchpriority="high" />
        </picture>
      </div>

      <div class="home-banner__content">
        <h1 class="home-banner__title">{{ text }}</h1>
        <p class="home-banner__description">
          打造数字语音课程，PPT转视频，个性化语音合成等。<br />
          提供智能配音、声音克隆、教育教学等服务，帮助用户实现语音定制化需求。
        </p>
        <div class="home-banner__actions">
          <el-button class="home-banner__btn ps-btn ps-btn--primary" type="primary" @click="handleStartUsing">
            开始使用
          </el-button>
          <el-button class="home-banner__btn home-banner__btn--light ps-btn ps-btn--secondary" type="default" @click="handleLearnMore">
            了解更多
          </el-button>
        </div>
      </div>
    </section>

    <section class="section-box section-box--tech">
      <div class="bg-wrapper">
        <picture>
          <source :srcset="techBannerWebp" type="image/webp" />
          <img class="home-banner__img" :src="techBannerPng" alt="技术背景图" loading="lazy" />
        </picture>
      </div>

      <div class="section-two__content">
        <h1 class="title-tech">{{ title }}<span class="cursor">|</span></h1>
      </div>
    </section>

    <section class="section-box section-box--feature section-three-bg">
      <div class="section-three__header">
        <h1 class="title-tech-three">
          {{ titleThree }}<span class="cursor">|</span>
        </h1>
      </div>

      <div class="cards-container">
        <el-row :gutter="40">
          <el-col v-for="item in featureCards.slice(0, 2)" :key="item.title" :span="12" class="grid-col">
            <div class="tech-item" @click="openFeature(item.route)">
              <div class="img-box">
                <picture>
                  <source :srcset="item.webp" type="image/webp" />
                  <img :src="item.png" :alt="item.title" loading="lazy" />
                </picture>
              </div>
              <div class="tech-item__footer">{{ item.title }}</div>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="40">
          <el-col v-for="item in featureCards.slice(2)" :key="item.title" :span="12" class="grid-col">
            <div class="tech-item" @click="openFeature(item.route)">
              <div class="img-box">
                <picture>
                  <source :srcset="item.webp" type="image/webp" />
                  <img :src="item.png" :alt="item.title" loading="lazy" />
                </picture>
              </div>
              <div class="tech-item__footer">{{ item.title }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </section>

    <section class="section-box section-box--courses section-three-bg">
      <div class="section-four__header">
        <h2 class="title-tech-four">
          {{ titleFour }}<span class="cursor">|</span>
        </h2>
      </div>

      <div class="carousel-container">
        <el-carousel :interval="4000" type="card" height="400px" indicator-position="outside">
          <el-carousel-item v-for="item in carouselItems" :key="item.title">
            <div class="custom-card" @click="openFeature(item.route)">
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

    <footer class="site-footer">
      <div class="site-footer__inner">
        <div class="site-footer__brand">
          <img src="../assets/images/logo.png" alt="Parrot Sound" />
          <div>
            <strong>ParrotSound</strong>
            <p>面向配音、克隆和教学内容生产的 AI 语音工作台。</p>
          </div>
        </div>

        <div class="site-footer__links">
          <RouterLink to="/dubbing">智能配音</RouterLink>
          <RouterLink to="/clone">声音克隆</RouterLink>
          <RouterLink to="/teaching">教育教学</RouterLink>
          <RouterLink to="/community">社区交流</RouterLink>
          <RouterLink to="/help">帮助中心</RouterLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useTypeWriter } from "../composables/HomeTpyeWriter";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const bannerImageWebp = new URL("../assets/images/banner-computer.webp", import.meta.url).href;
const bannerImageJpg = new URL("../assets/images/banner-computer.jpg", import.meta.url).href;
const techBannerWebp = new URL("../assets/images/tech-banner.webp", import.meta.url).href;
const techBannerPng = new URL("../assets/images/tech-banner.png", import.meta.url).href;
const { text } = useTypeWriter("鹦音坊 AI 语音平台", 100, 500);
const { text: title } = useTypeWriter("强大的核心技术", 150, 1000);
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

const featureCards = [
  {
    title: "现场录音功能",
    route: "/clone",
    webp: new URL("../assets/images/tech-1.webp", import.meta.url).href,
    png: new URL("../assets/images/tech-1.png", import.meta.url).href,
  },
  {
    title: "标准音频预设",
    route: "/dubbing",
    webp: new URL("../assets/images/tech-2.webp", import.meta.url).href,
    png: new URL("../assets/images/tech-2.png", import.meta.url).href,
  },
  {
    title: "定制化语音讲解",
    route: "/teaching",
    webp: new URL("../assets/images/tech-3.webp", import.meta.url).href,
    png: new URL("../assets/images/tech-3.png", import.meta.url).href,
  },
  {
    title: "音频文件上传",
    route: "/audio-record",
    webp: new URL("../assets/images/tech-4.webp", import.meta.url).href,
    png: new URL("../assets/images/tech-4.png", import.meta.url).href,
  },
];

const carouselItems = [
  {
    title: "声音置换与字幕",
    route: "/dubbing",
    img: new URL("../assets/images/course-1.png", import.meta.url).href,
    webp: new URL("../assets/images/course-1.webp", import.meta.url).href,
    desc: "自动识别语音内容并生成字幕，支持多语种声音一键置换，保留原视频背景音。",
  },
  {
    title: "3D数字人",
    route: "/community",
    img: new URL("../assets/images/course-2.png", import.meta.url).href,
    webp: new URL("../assets/images/course-2.webp", import.meta.url).href,
    desc: "高精度3D虚拟数字人形象，支持表情驱动与动作捕捉，打造沉浸式教学体验。",
  },
  {
    title: "语音合成",
    route: "/dubbing",
    img: new URL("../assets/images/course-3.png", import.meta.url).href,
    webp: new URL("../assets/images/course-3.webp", import.meta.url).href,
    desc: "依托语音生成、数字人讲解及多模态内容生成，全面支持教师与学生的互动式学习需求。",
  },
  {
    title: "声音克隆",
    route: "/clone",
    img: new URL("../assets/images/course-4.png", import.meta.url).href,
    webp: new URL("../assets/images/course-4.webp", import.meta.url).href,
    desc: "只需少量音频数据即可快速克隆目标声音，还原度高，适用于个性化配音场景。",
  },
  {
    title: "有声课件",
    route: "/teaching",
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

const openFeature = (routePath: string) => {
  router.push(routePath);
};
</script>

<style scoped>
.home-page {
  background: var(--app-bg);
}

.section-box {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.section-box--hero {
  min-height: calc(100vh - var(--header-height));
}

.section-box--tech {
  min-height: 620px;
}

.section-box--feature {
  min-height: 860px;
}

.section-box--courses {
  min-height: 760px;
  padding-bottom: 20px;
}

.home-banner {
  width: 100%;
  height: 100%;
  min-height: inherit;
  overflow: hidden;
}

.home-banner__img {
  width: 100%;
  height: 100%;
  min-height: inherit;
  object-fit: cover;
}

.home-banner__content {
  position: absolute;
  top: 42%;
  left: 12%;
  transform: translateY(-50%);
  max-width: 720px;
  z-index: 10;
}

.home-banner__title {
  background: linear-gradient(45deg, #bbc0df, #4754a6);
  -webkit-background-clip: text;
  background-clip: text;
  font-size: clamp(54px, 7vw, 82px);
  font-weight: 700;
  color: transparent;
  margin: 0 0 14px;
  line-height: 1.02;
  white-space: nowrap;
  word-break: keep-all;
}

.home-banner__title::after {
  content: "|";
  color: #1b1b1b;
  animation: blink 1s step-end infinite;
}

.home-banner__description {
  font-size: clamp(20px, 2vw, 28px);
  color: #6f7fd7;
  margin: 0 0 28px;
  line-height: 1.6;
}

.home-banner__actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.home-banner__btn {
  min-width: 160px;
}

.home-banner__btn--light {
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
}

.section-two__content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  text-align: center;
  width: 100%;
}

.title-tech {
  font-size: clamp(56px, 8vw, 120px);
  font-weight: 800;
  letter-spacing: 4px;
  background: linear-gradient(45deg, #bbc0df, #4754a6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.section-three-bg {
  background: linear-gradient(180deg, rgba(240, 247, 255, 0.72), rgba(230, 241, 255, 0.62));
}

.section-three__header {
  position: absolute;
  top: 36px;
  left: 0;
  width: 100%;
  text-align: center;
  z-index: 10;
  padding: 0 20px;
}

.title-tech-three {
  font-size: clamp(24px, 3vw, 34px);
  font-weight: 800;
  letter-spacing: 2px;
  background: linear-gradient(45deg, #bbc0df, #4754a6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.cards-container {
  position: absolute;
  top: 170px;
  left: 50%;
  transform: translateX(-50%);
  width: 1000px;
  max-width: calc(100% - 40px);
  z-index: 10;
}

.grid-col {
  margin-bottom: 30px;
}

.tech-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  background-color: var(--surface-elevated);
  cursor: pointer;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  height: 260px;
  display: flex;
  flex-direction: column;
}

.tech-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
}

.img-box {
  flex: 1;
  width: 100%;
  overflow: hidden;
}

.img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.tech-item:hover .img-box img {
  transform: scale(1.05);
}

.tech-item__footer {
  height: 50px;
  line-height: 50px;
  background: linear-gradient(90deg, #bbc0df, #4754a6);
  color: #fff;
  text-align: center;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 1px;
}

.section-four__header {
  text-align: center;
  padding-top: 48px;
  margin-bottom: 32px;
}

.title-tech-four {
  font-size: clamp(30px, 4vw, 48px);
  font-weight: 800;
  letter-spacing: 2px;
  background: linear-gradient(45deg, #bbc0df, #4754a6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.carousel-container {
  width: 1200px;
  max-width: calc(100% - 40px);
  margin: 0 auto;
}

.custom-card {
  width: 100%;
  height: 100%;
  background: var(--surface-elevated);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
}

.card-header {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: var(--text-strong);
  background-color: var(--surface-elevated);
  border-bottom: 1px solid var(--ps-btn-secondary-border);
}

.card-img-box {
  flex: 1;
  width: 100%;
  overflow: hidden;
  background: var(--surface-elevated);
}

.card-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-desc {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 140px;
  padding: 20px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.78);
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.4s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-desc p {
  font-size: 14px;
  line-height: 1.6;
  text-align: left;
  color: #fff;
  margin: 0;
}

.el-carousel__item.is-active .custom-card {
  box-shadow: 0 12px 32px rgba(83, 98, 188, 0.3);
}

.el-carousel__item.is-active .card-desc {
  opacity: 1;
  transform: translateY(0);
  background: linear-gradient(180deg, rgba(135, 147, 240, 0.9) 0%, rgba(83, 98, 188, 0.95) 100%);
}

.el-carousel__item:not(.is-active) .custom-card {
  filter: grayscale(20%);
  opacity: 0.9;
}

.cursor {
  font-weight: 100;
  margin-left: 5px;
  animation: blink 1s infinite;
}

.site-footer {
  padding: 40px 24px 56px;
  background: transparent;
}

.site-footer__inner {
  max-width: 1240px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
  padding: 28px 32px;
  border-radius: 28px;
  background: linear-gradient(135deg, #58aefe 0%, #2563eb 100%);
  color: #f8fafc;
}

.site-footer__brand {
  display: flex;
  align-items: center;
  gap: 18px;
}

.site-footer__brand img {
  width: 56px;
  flex-shrink: 0;
}

.site-footer__brand p {
  margin-top: 6px;
  color: rgba(248, 250, 252, 0.72);
}

.site-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: rgba(248, 250, 252, 0.88);
}

@media (max-width: 1080px) {
  .section-box--feature {
    min-height: 980px;
  }

  .section-box--courses {
    min-height: 720px;
  }
}

@media (max-width: 768px) {
  .section-box,
  .section-box--hero,
  .section-box--tech,
  .section-box--feature,
  .section-box--courses {
    min-height: auto;
  }

  .home-banner__content,
  .section-two__content,
  .section-three__header,
  .cards-container {
    position: static;
    transform: none;
  }

  .home-banner {
    min-height: 420px;
  }

  .home-banner__content {
    padding: 28px 20px 36px;
    max-width: none;
    background: var(--surface-elevated);
  }

  .home-banner__title {
    font-size: clamp(34px, 8vw, 52px);
  }

  .section-two__content {
    padding: 40px 16px 48px;
  }

  .section-three__header {
    padding: 36px 16px 0;
  }

  .cards-container {
    width: auto;
    max-width: none;
    padding: 28px 16px 40px;
  }

  .carousel-container {
    max-width: calc(100% - 16px);
  }

  .site-footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .site-footer__inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
