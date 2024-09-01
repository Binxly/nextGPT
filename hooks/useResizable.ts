import { RefObject, useCallback } from 'react';

export function useResizable(
  ref: RefObject<HTMLElement>,
  setWidth: (width: number) => void,
  minWidth: number,
  maxWidth: number
) {
  const initResize = useCallback((mouseDownEvent: React.MouseEvent) => {
    const startSize = ref.current?.getBoundingClientRect().width ?? 0;
    const startPosition = mouseDownEvent.pageX;

    function onMouseMove(mouseMoveEvent: MouseEvent) {
      const newWidth = startSize - startPosition + mouseMoveEvent.pageX;
      setWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
    }

    function onMouseUp() {
      document.body.removeEventListener("mousemove", onMouseMove);
      document.body.removeEventListener("mouseup", onMouseUp);
    }

    document.body.addEventListener("mousemove", onMouseMove);
    document.body.addEventListener("mouseup", onMouseUp);
  }, [ref, setWidth, minWidth, maxWidth]);

  return { initResize };
}