export function createVisibleRenderLoop({
  element,
  draw,
  enabled = true,
}: {
  element: HTMLElement;
  draw: (time: number) => boolean;
  enabled?: boolean;
}) {
  const bounds = element.getBoundingClientRect();
  let visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
  let frame = 0;
  let disposed = false;

  function stop() {
    window.cancelAnimationFrame(frame);
    frame = 0;
  }

  function request() {
    if (!disposed && enabled && visible && !document.hidden && !frame) {
      frame = window.requestAnimationFrame(tick);
    }
  }

  function tick(time: number) {
    frame = 0;
    if (!disposed && enabled && visible && !document.hidden && draw(time)) request();
  }

  const observer = new IntersectionObserver(entries => {
    visible = entries[entries.length - 1]?.isIntersecting ?? false;
    if (visible) request();
    else stop();
  });
  observer.observe(element);

  function visibilityChanged() {
    if (document.hidden) stop();
    else request();
  }
  document.addEventListener("visibilitychange", visibilityChanged);
  request();

  return {
    request,
    setEnabled(next: boolean) {
      enabled = next;
      if (enabled) request();
      else stop();
    },
    destroy() {
      disposed = true;
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibilityChanged);
    },
  };
}
