import { ref } from 'vue'

export interface VoiceCard {
  id: number
  name: string
  username: string
  date: string
  tags: string[]
  stats: {
    play: number
    like: number
    share: number
    star: number
  }
  avatar: string
}

export interface RankItem {
  id: number
  name: string
  username: string
  likes: number
  avatar: string
}

export function useCommunityLogic() {
  
  // === 状态 ===
  const sortValue = ref('推荐')
  const langValue = ref('中文')
  const searchText = ref('')

  // === 模拟左侧列表数据 ===
  const voiceList = ref<VoiceCard[]>([
    {
      id: 1,
      name: '刘德华',
      username: '用户89757',
      date: '2025/1/22',
      tags: ['古灵精怪', '磁性'],
      stats: { play: 2131, like: 2131, share: 2131, star: 2131 },
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
    },
    {
      id: 2,
      name: '孙燕姿',
      username: '音乐人小A',
      date: '2025/1/22',
      tags: ['清澈', '高音'],
      stats: { play: 1099, like: 888, share: 120, star: 560 },
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
    },
    {
      id: 3,
      name: '周杰伦',
      username: 'JayFan',
      date: '2025/1/23',
      tags: ['R&B', '低沉'],
      stats: { play: 5555, like: 4321, share: 1111, star: 999 },
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
    }
  ])

  // === 模拟右侧排行榜数据 ===
  const rankList = ref<RankItem[]>([
    { id: 1, name: '刘德华', username: '用户名', likes: 2131, avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
    { id: 2, name: '林俊杰', username: '用户名', likes: 2131, avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
    { id: 3, name: '陈奕迅', username: '用户名', likes: 2131, avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
    { id: 4, name: '邓紫棋', username: '用户名', likes: 2131, avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
    { id: 5, name: '王力宏', username: '用户名', likes: 2131, avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
  ])

  return {
    sortValue,
    langValue,
    searchText,
    voiceList,
    rankList
  }
}