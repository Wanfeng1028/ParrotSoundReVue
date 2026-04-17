import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

// 定义幻灯片/场景接口
export interface Slide {
  id: number
  thumbnail: string
  isActive: boolean
}

export function useEducationLogic() {
  
  // === 1. 顶部设置 ===
  const canvasSettings = reactive({
    ratio: '16:9',
    resolution: '1080P',
    bitrate: '默认'
  })

  // === 2. 左侧：幻灯片列表 ===
  const currentMode = ref<'ppt' | 'video'>('ppt') // 模式切换
  const slides = ref<Slide[]>([
    { id: 1, thumbnail: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg', isActive: true },
    { id: 2, thumbnail: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg', isActive: false },
    { id: 3, thumbnail: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg', isActive: false },
  ])

  // === 3. 中间：编辑器状态 ===
  const textContent = ref('')
  const isPlaying = ref(false)
  const showSubtitle = ref(true)
  const isTrackExpanded = ref(false) // 是否展开轨道 (底部那个抽屉)
  
  // 播放进度 (模拟)
  const currentTime = ref('00:00')
  //const totalTime = ref('00:00:00')

  // === 4. 右侧：素材库 ===
  const activeRightTab = ref('digital') // digital, voice, bg, text, music
  const searchText = ref('')
  
  // 模拟数字人列表
  const avatarList = ref([
    { id: 1, img: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
    { id: 2, img: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
    { id: 3, img: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
    { id: 4, img: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
  ])


  // === 动作函数 ===
  const toggleMode = () => {
    currentMode.value = currentMode.value === 'ppt' ? 'video' : 'ppt'
    ElMessage.success(`已切换至${currentMode.value === 'ppt' ? 'PPT' : '视频'}模式`)
  }

  const selectSlide = (id: number) => {
    slides.value.forEach(s => s.isActive = (s.id === id))
  }

  const toggleTrack = () => {
    isTrackExpanded.value = !isTrackExpanded.value
  }

  const handleSave = () => ElMessage.success('保存成功')
  const handleGenerate = () => ElMessage.success('开始生成视频')

  return {
    canvasSettings,
    currentMode,
    slides,
    textContent,
    isPlaying,
    showSubtitle,
    isTrackExpanded,
    currentTime,
    activeRightTab,
    avatarList,
    searchText,
    toggleMode,
    selectSlide,
    toggleTrack,
    handleSave,
    handleGenerate
  }
}