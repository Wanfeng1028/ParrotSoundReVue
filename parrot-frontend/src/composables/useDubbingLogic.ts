import {ref , reactive} from 'vue'
import {ElMessage} from 'element-plus'

//定义配音员的数据类型
interface Voice{
    id:number;
    name:string;
    tag:string;//配音员标签
    avatar:string;//头像图片路径
}

export function useDubbingLogic(){
    //1.核心数据
    const textContent = ref('');//用户输入的文案
    const aiInput = ref(''); // 顶部 AI 生成文案的输入框

    //播放设置
    const settings = reactive({
        speed:1.0,//播放速s度
        volume:1.0,//音量
        pitch:1.0,//音高，语调
        bgMusic:null,//背景音乐文件路径

    })

    //2.模拟配音员列表
    const voiceList = ref<Voice[]>([
        //从后端的api获取数据，这里是模拟的数据
        { id: 1, name: '谈小语', tag: '多情感', avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
        { id: 2, name: '云希', tag: '新闻', avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png' },
        { id: 3, name: '晓晓', tag: '活泼', avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png' },
        { id: 4, name: '云野', tag: '沉稳', avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png' },
    ])
    //3.当前选中的配音员列表
    const currentVoice = ref<Voice>(voiceList.value[0] as Voice);
    //4.动作函数
    //切换配音员
    const selectVoice = (voice:Voice) => {
        currentVoice.value = voice;
    }
    // 4. 情感列表 (对应右下角的情感按钮)
    const emotionList = ref([
        '默认', '热情', '兴奋', 
        '友好', '轻松', '愉快', 
        '严肃', '不满', '生气'
    ]);
    const currentEmotion = ref('默认'); // 当前选中的情感
    const selectEmotion = (emotion: string) => {
        currentEmotion.value = emotion;
    }
    //试听
    const handlePlay = ( ) => {
        if(!textContent.value){
            ElMessage.warning('请输入要配音的文字');
            return;
        }
        ElMessage.success(`试听成功，使用声音:${currentVoice.value.name}`);
        //调用后端的api，传入textContent.value,currentVoice.value.id,setting
        //返回一个音频文件路径，播放该文件
    } 
    //清空文本
    const handleClear = () => {
        textContent.value = '';
    }
    const handleExport = () => {
        if (!textContent.value) {
             ElMessage.warning('没有内容可以导出');
             return;
        }
        ElMessage.success('正在导出音频...');
    }
    // AI 生成文案 (模拟)
    const handleAIGenerate = () => {
        if(!aiInput.value) return ElMessage.warning('请输入描述');
        textContent.value = "AI 正在根据您的需求生成文案...\n(这里是模拟的生成结果)";
    }
    return {
        textContent,
        aiInput,
        currentVoice,
        voiceList,
        settings,
        emotionList,
        currentEmotion,
        selectVoice,
        selectEmotion,
        handlePlay,
        handleClear,
        handleExport,
        handleAIGenerate
    }



}
