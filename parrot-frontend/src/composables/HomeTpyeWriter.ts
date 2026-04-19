import { onBeforeUnmount, onMounted, ref } from "vue";

export function useTypeWriter(fullText: string, speed = 120, delay = 0, pauseTime = 2000) {
  const text = ref("");
  let timer: number | null = null;
  let index = 0;

  const start = () => {
    if (timer !== null) {
      window.clearTimeout(timer);
    }

    const typing = () => {
      if (index <= fullText.length) {
        text.value = fullText.slice(0, index);
        index += 1;
        timer = window.setTimeout(typing, speed);
        return;
      }

      timer = window.setTimeout(() => {
        index = 0;
        start();
      }, pauseTime);
    };

    timer = window.setTimeout(typing, delay);
  };

  const stop = () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  onMounted(start);
  onBeforeUnmount(stop);

  return {
    text,
    start,
    stop,
  };
}
