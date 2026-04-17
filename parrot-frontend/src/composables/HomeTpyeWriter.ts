import { ref, onMounted, onBeforeUnmount } from "vue";

/**
 * 打字机效果 composable
 * @param fullText 要打出来的完整文字
 * @param speed 每个字出现的速度（ms）
 * @param delay 开始前延迟（ms）
 * @param pauseTime 打完字后停顿的时间(ms)，默认2000ms
 */

export function useTypeWriter(fullText: string, speed = 120, delay = 0, pauseTime = 2000) {
    //定义一个响应式变量，text，初始值为空字符串
    //使用 ref 是为了让 Vue 知道当这个值改变时，需要更新页面。
    //text是响应式文本
    const text = ref(""); 
    // 定义一个普通的时间变量，用来存储定时器
    // timer 用来存放 setTimeout 的 ID。我们需要它来能在中途取消打字（比如用户离开了页面）。
    let timer: number | null = null;
    text.value = ""; // 清空当前文字
    let i = 0;
    //下面是两个方法start和stop
    const start = () => {
        
        if (timer !== null) {
            clearTimeout(timer);
        }
        
        const typing = () => {
            
            if(i <= fullText.length){
                text.value = fullText.slice(0, i);
                i++;
                console.log(text.value);
                timer = setTimeout(typing, speed); // 100ms 后再来一次
            }
            else{
                 // ✅ 打完文字后，停顿指定时间，再重置下标重新开始 → 无限循环核心
                timer = window.setTimeout(() => {
                    i = 0; // 重置下标
                    start(); // 重新调用打字方法
                }, pauseTime);
            }
            
        }
        // 启动第一次打字：先延迟 delay 毫秒，然后执行 typing
        timer = window.setTimeout(typing, delay);
        // typing();//立即开始打字

    }
    const stop = () => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null; // 重置 timer 为 null
        }
    }
    //生命周期挂钩
    // onMounted: 当组件加载完成时，自动调用 start() 开始打字
    onMounted(() => start());

    // onBeforeUnmount: 当组件卸载前，自动调用 stop() 停止打字
    onBeforeUnmount(() => stop());

  return {
    text,   // 当前已经打出来的字
    start,  // 重新开始打字
    stop,   // 停止
  }

}