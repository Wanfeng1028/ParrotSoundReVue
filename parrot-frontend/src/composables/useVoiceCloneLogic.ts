import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

// 定义声音模型接口
export interface VoiceModel {
  id: number
  name: string
  tag: string
  date: string
  image: string
}

export function useVoiceCloneLogic() {
  
  // === 1. 表单数据 ===
  const formData = reactive({
    name: '',
    description: '',
    isPublic: true, // true=公开, false=私有
    coverImage: ''
  })

  // === 2. 界面状态控制 ===
  // mode: 'select' (默认选择界面), 'record' (录音中), 'upload' (上传中)
  const uploadMode = ref<'select' | 'record' | 'upload'>('select')
  
  // 录音计时器
  const recordTimer = ref('00 : 00')
  const isRecording = ref(false)
  let timerInterval: any = null

  // === 3. 右侧“我的声音”列表数据 (模拟) ===
  const myVoices = ref<VoiceModel[]>([
    { id: 1, name: '命名', tag: '古灵精怪', date: '2025/1/22', image: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
    { id: 2, name: '命名', tag: '', date: '2025/1/22', image: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png' },
    { id: 3, name: '命名', tag: '', date: '2025/1/22', image: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
  ])

  // === 4. 动作函数 ===

  // 切换公开/私有
  const setPrivacy = (isPublic: boolean) => {
    formData.isPublic = isPublic
  }

  // 进入录音模式
  const enterRecordMode = () => {
    uploadMode.value = 'record'
    startTimer()
  }

  // 返回选择模式
  const goBack = () => {
    stopTimer()
    uploadMode.value = 'select'
  }

  // 模拟录音计时
  const startTimer = () => {
    isRecording.value = true
    let sec = 0
    recordTimer.value = "00 : 00"
    timerInterval = setInterval(() => {
      sec++
      const m = Math.floor(sec / 60).toString().padStart(2, '0')
      const s = (sec % 60).toString().padStart(2, '0')
      recordTimer.value = `${m} : ${s}`
    }, 1000)
  }

  const stopTimer = () => {
    isRecording.value = false
    if (timerInterval) clearInterval(timerInterval)
  }

  // 提交
  const handleSubmit = () => {
    if (!formData.name) return ElMessage.warning('请输入模型名称')
    ElMessage.success('提交成功，声音克隆任务已开始')
  }

  // 删除声音
  const handleDelete = (id: number) => {
    myVoices.value = myVoices.value.filter(v => v.id !== id)
    ElMessage.success('删除成功')
  }

  return {
    formData,
    uploadMode,
    recordTimer,
    isRecording,
    myVoices,
    setPrivacy,
    enterRecordMode,
    goBack,
    stopTimer,
    handleSubmit,
    handleDelete
  }
}