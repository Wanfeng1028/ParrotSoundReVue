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
          <el-button class="home-banner__btn" type="primary" @click="handleStartUsing">
            开始使用
          </el-button>
          <el-button class="home-banner__btn home-banner__btn--light" type="default" @click="handleLearnMore">
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

    <section class="section-box section-box--courses section-three-bg">
      <div class="section-four__header">
        <h2 class="title-tech-four">
          {{ titleFour }}<span class="cursor">|</span>
        </h2>
      </div>

      <div class="carousel-container">
        <el-carousel :interval="4000" type="card" height="400px" indicator-position="outside">
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

const carouselItems = [
  {
    title: "声音置换与字幕",
    img: new URL("../assets/images/course-1.png", import.meta.url).href,
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
    desc: "依托语音生成、数字人讲解及多模态内容生成，全面支持教师与学生的互动式学习需求。",
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
.home-page {
  background: #ffffff;
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
  top: 46%;
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
  width: 128px;
  height: 42px;
  font-size: 16px;
}

.home-banner__btn--light {
  background: rgba(255, 255, 255, 0.88);
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
  background-color: #fbfbfc;
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
  background-color: #fff;
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
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
}

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

.card-img-box {
  flex: 1;
  width: 100%;
  overflow: hidden;
  background: #fff;
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
  background: rgba(255, 255, 255, 0.9);
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
  background: #ffffff;
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
  background: rgba(17, 32, 49, 0.95);
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
    background: #ffffff;
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
