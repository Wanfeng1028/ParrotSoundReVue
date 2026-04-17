import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

export function useHelpLogic() {
  
  // 当前选中的 Tab
  const activeTab = ref('guide') // guide, dubbing, clone, education, feedback

  // 意见反馈表单
  const feedbackForm = reactive({
    usageTime: '不到 1 个月', // 默认选中第一个
    content: ''
  })

  // 模拟教程视频数据
  const videoList = ref([
    { id: 1, title: '基础入门教程', duration: '00:30' },
    { id: 2, title: '进阶使用技巧', duration: '00:30' },
  ])

  // === 动作 ===
  const switchTab = (tab: string) => {
    activeTab.value = tab
  }

  const submitFeedback = () => {
    if(!feedbackForm.content) return ElMessage.warning('请填写描述信息')
    ElMessage.success('反馈提交成功！')
    feedbackForm.content = ''
  }

  return {
    activeTab,
    feedbackForm,
    videoList,
    switchTab,
    submitFeedback
  }
}