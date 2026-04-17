<template>
  <div class="home-page">
    <section class="hero-section">
      <div class="hero-section__inner">
        <div class="hero-copy">
          <span class="hero-copy__badge">AI Voice Workflow Platform</span>
          <h1 class="hero-copy__title">{{ text }}</h1>
          <p class="hero-copy__description">
            把智能配音、声音克隆、教学课件和异步任务管理串成一条可落地的生产链路。
            适合内容团队、课程团队和需要快速制作语音资产的产品团队。
          </p>
          <div class="hero-copy__actions">
            <el-button class="hero-copy__primary" type="primary" @click="handleStartUsing">
              进入工作台
            </el-button>
            <el-button class="hero-copy__secondary" @click="handleLearnMore">
              查看帮助
            </el-button>
          </div>
          <div class="hero-metrics">
            <div v-for="item in heroMetrics" :key="item.label" class="hero-metric">
              <strong>{{ item.value }}</strong>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="hero-visual__frame">
            <div class="hero-visual__panel">
              <div class="hero-visual__panel-label">实时业务场景</div>
              <h2>从脚本生成到任务交付，一套界面完成。</h2>
              <ul>
                <li>AI 文稿生成 + 任务轮询</li>
                <li>声音资产复用与社区沉淀</li>
                <li>课件模式与讲解视频模式双轨支持</li>
              </ul>
            </div>
            <picture class="hero-visual__image-box">
              <source :srcset="bannerImageWebp" type="image/webp" />
              <img class="hero-visual__image" :src="bannerImageJpg" alt="Parrot Sound dashboard preview" fetchpriority="high" />
            </picture>
          </div>
        </div>
      </div>
    </section>

    <section class="content-section">
      <div class="section-heading">
        <span class="section-heading__eyebrow">核心能力</span>
        <h2>内容驱动的产品官网，而不是堆满整屏特效的原型页。</h2>
        <p>围绕真实工作流重新组织信息层级，让用户先理解产品价值，再进入具体功能。</p>
      </div>

      <div class="feature-grid">
        <article v-for="feature in featureCards" :key="feature.title" class="feature-card">
          <picture class="feature-card__image-box">
            <source :srcset="feature.webp" type="image/webp" />
            <img class="feature-card__image" :src="feature.png" :alt="feature.title" loading="lazy" />
          </picture>
          <div class="feature-card__body">
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="content-section content-section--soft">
      <div class="section-heading">
        <span class="section-heading__eyebrow">产品矩阵</span>
        <h2>把不同角色的核心任务拆清楚，减少首次进入时的信息噪声。</h2>
      </div>

      <div class="showcase-grid">
        <article v-for="item in showcaseCards" :key="item.title" class="showcase-card">
          <div class="showcase-card__header">
            <h3>{{ item.title }}</h3>
            <span>{{ item.tag }}</span>
          </div>
          <picture class="showcase-card__image-box">
            <source :srcset="item.webp" type="image/webp" />
            <img :src="item.img" :alt="item.title" loading="lazy" />
          </picture>
          <p>{{ item.desc }}</p>
        </article>
      </div>
    </section>

    <section class="content-section content-section--compact">
      <div class="workflow-card">
        <div class="workflow-card__copy">
          <span class="section-heading__eyebrow">交付方式</span>
          <h2>任务化处理重操作，页面层只承担配置、反馈和结果回查。</h2>
          <p>
            当前前端已经围绕异步任务设计交互：AI 生成、试听、导出和教学任务都可以统一接入同一套状态反馈。
          </p>
        </div>
        <div class="workflow-card__steps">
          <div v-for="(step, index) in workflowSteps" :key="step.title" class="workflow-step">
            <span>{{ `0${index + 1}` }}</span>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <footer class="site-footer">
      <div class="site-footer__inner">
        <div class="site-footer__brand">
          <img src="../assets/images/logo.png" alt="Parrot Sound ReVue" />
          <div>
            <strong>ParrotSoundReVue</strong>
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

const { text } = useTypeWriter("让 AI 语音生产真正进入可交付状态。", 70, 400);

const heroMetrics = [
  { value: "4", label: "核心工作流" },
  { value: "AI + Queue", label: "异步任务架构" },
  { value: "Vue 3 / Express", label: "全栈实现" },
];

const featureCards = [
  {
    title: "声音采集与录制",
    description: "支持现场录音与上传样本，方便快速建立可复用的声音资产。",
    webp: new URL("../assets/images/tech-1.webp", import.meta.url).href,
    png: new URL("../assets/images/tech-1.png", import.meta.url).href,
  },
  {
    title: "标准化音频预设",
    description: "对音色、情绪、速度和任务参数做统一收口，减少页面层重复配置。",
    webp: new URL("../assets/images/tech-2.webp", import.meta.url).href,
    png: new URL("../assets/images/tech-2.png", import.meta.url).href,
  },
  {
    title: "教学讲解资源",
    description: "课件模式和讲解视频模式共用一套配置与保存流程，便于持续扩展。",
    webp: new URL("../assets/images/tech-3.webp", import.meta.url).href,
    png: new URL("../assets/images/tech-3.png", import.meta.url).href,
  },
  {
    title: "文件上传与任务产出",
    description: "重操作全部收敛成任务，用户可以明确感知进度、结果和历史记录。",
    webp: new URL("../assets/images/tech-4.webp", import.meta.url).href,
    png: new URL("../assets/images/tech-4.png", import.meta.url).href,
  },
];

const showcaseCards = [
  {
    title: "智能配音",
    tag: "Script to Voice",
    img: new URL("../assets/images/course-1.png", import.meta.url).href,
    webp: new URL("../assets/images/course-1.webp", import.meta.url).href,
    desc: "从提示词生成文稿，到试听导出与历史回查，形成完整闭环。",
  },
  {
    title: "声音克隆",
    tag: "Voice Asset",
    img: new URL("../assets/images/course-4.png", import.meta.url).href,
    webp: new URL("../assets/images/course-4.webp", import.meta.url).href,
    desc: "建立可复用的音色资产库，并沉淀到社区和教学场景继续复用。",
  },
  {
    title: "教学内容生产",
    tag: "Course Builder",
    img: new URL("../assets/images/course-5.png", import.meta.url).href,
    webp: new URL("../assets/images/course-5.webp", import.meta.url).href,
    desc: "围绕课件、脚本、数字人和声音配置，支撑课程生产的多步骤协同。",
  },
];

const workflowSteps = [
  { title: "选择页面与资源", description: "先明确业务目标，再进入配音、克隆或教学工作流。" },
  { title: "发起 AI / 生成任务", description: "把耗时操作切到异步任务，页面只负责给出状态反馈。" },
  { title: "回查结果与复用资产", description: "结果进入历史、社区或教学项目，形成可持续迭代的数据面。" },
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
  color: var(--text-strong);
}

.hero-section,
.content-section {
  padding: 40px 24px 0;
}

.hero-section__inner,
.content-section,
.site-footer__inner {
  max-width: 1240px;
  margin: 0 auto;
}

.hero-section__inner {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 32px;
  align-items: center;
}

.hero-copy {
  padding: 44px 0 36px;
}

.hero-copy__badge,
.section-heading__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(13, 148, 136, 0.1);
  color: var(--brand-700);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-copy__title {
  margin-top: 18px;
  font-size: clamp(40px, 5vw, 64px);
  line-height: 1.02;
  letter-spacing: -0.05em;
  max-width: 10ch;
}

.hero-copy__description {
  margin-top: 22px;
  max-width: 620px;
  font-size: 18px;
  line-height: 1.75;
  color: var(--text-muted);
}

.hero-copy__actions {
  display: flex;
  gap: 14px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.hero-copy__primary,
.hero-copy__secondary {
  min-height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  font-weight: 700;
}

.hero-copy__primary {
  background: linear-gradient(135deg, var(--brand-600), var(--accent-500));
  border: none;
  box-shadow: 0 20px 40px rgba(15, 118, 110, 0.2);
}

.hero-copy__secondary {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(17, 32, 49, 0.08);
  color: var(--text-strong);
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 34px;
}

.hero-metric {
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(17, 32, 49, 0.06);
  box-shadow: var(--shadow-soft);
}

.hero-metric strong {
  display: block;
  font-size: 24px;
  margin-bottom: 6px;
}

.hero-metric span {
  color: var(--text-muted);
  font-size: 14px;
}

.hero-visual__frame {
  position: relative;
  padding: 20px;
  border-radius: 34px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(231, 242, 241, 0.88));
  box-shadow: var(--shadow-strong);
  overflow: hidden;
}

.hero-visual__frame::before {
  content: "";
  position: absolute;
  inset: auto -10% -20% 40%;
  height: 240px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.2), transparent 65%);
}

.hero-visual__panel {
  position: relative;
  z-index: 1;
  margin-bottom: 18px;
  padding: 20px 22px;
  border-radius: 24px;
  background: rgba(17, 32, 49, 0.92);
  color: #f8fafc;
}

.hero-visual__panel-label {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.16);
  color: #99f6e4;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-visual__panel h2 {
  margin: 14px 0 12px;
  font-size: 28px;
  line-height: 1.2;
}

.hero-visual__panel ul {
  padding-left: 18px;
  color: rgba(248, 250, 252, 0.82);
  line-height: 1.8;
}

.hero-visual__image-box {
  position: relative;
  z-index: 1;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(17, 32, 49, 0.08);
}

.hero-visual__image {
  width: 100%;
  min-height: 360px;
  object-fit: cover;
}

.section-heading {
  max-width: 720px;
  margin-bottom: 28px;
}

.section-heading h2 {
  margin-top: 16px;
  font-size: clamp(28px, 3vw, 42px);
  line-height: 1.15;
  letter-spacing: -0.04em;
}

.section-heading p {
  margin-top: 14px;
  font-size: 17px;
  line-height: 1.75;
  color: var(--text-muted);
}

.feature-grid,
.showcase-grid {
  display: grid;
  gap: 20px;
}

.feature-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.feature-card,
.showcase-card,
.workflow-card {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(17, 32, 49, 0.06);
  box-shadow: var(--shadow-soft);
}

.feature-card {
  overflow: hidden;
}

.feature-card__image-box {
  aspect-ratio: 16 / 10;
  overflow: hidden;
}

.feature-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.feature-card__body {
  padding: 22px;
}

.feature-card__body h3,
.showcase-card__header h3,
.workflow-step h3 {
  font-size: 22px;
  line-height: 1.2;
}

.feature-card__body p,
.showcase-card p,
.workflow-step p {
  margin-top: 12px;
  color: var(--text-muted);
  line-height: 1.75;
}

.content-section--soft {
  padding-top: 72px;
}

.showcase-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.showcase-card {
  padding: 22px;
}

.showcase-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.showcase-card__header span {
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: var(--accent-500);
  font-size: 12px;
  font-weight: 700;
}

.showcase-card__image-box {
  margin-top: 18px;
  border-radius: 22px;
  overflow: hidden;
  aspect-ratio: 16 / 10;
}

.showcase-card__image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-section--compact {
  padding-top: 72px;
  padding-bottom: 40px;
}

.workflow-card {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 28px;
  padding: 28px;
}

.workflow-card__copy h2 {
  margin-top: 16px;
  font-size: clamp(26px, 3vw, 38px);
  line-height: 1.15;
  letter-spacing: -0.04em;
}

.workflow-card__copy p {
  margin-top: 14px;
  color: var(--text-muted);
  line-height: 1.75;
}

.workflow-card__steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.workflow-step {
  padding: 20px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(244, 248, 251, 0.95), rgba(255, 255, 255, 0.92));
  border: 1px solid rgba(17, 32, 49, 0.06);
}

.workflow-step span {
  display: inline-flex;
  margin-bottom: 14px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--brand-700);
}

.site-footer {
  padding: 32px 24px 56px;
}

.site-footer__inner {
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
  .hero-section__inner,
  .workflow-card {
    grid-template-columns: 1fr;
  }

  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .showcase-grid,
  .workflow-card__steps {
    grid-template-columns: 1fr;
  }

  .site-footer__inner {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .hero-section,
  .content-section,
  .site-footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .hero-copy {
    padding-top: 20px;
  }

  .hero-copy__description {
    font-size: 16px;
  }

  .hero-metrics,
  .feature-grid {
    grid-template-columns: 1fr;
  }

  .hero-visual__panel h2 {
    font-size: 24px;
  }
}
</style>
