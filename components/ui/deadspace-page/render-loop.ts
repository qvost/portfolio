export function getSceneBufferSize({
  width,
  height,
  maxPixelRatio = 1.25,
}: {
  width: number;
  height: number;
  maxPixelRatio?: number;
}) {
  const ratio = Math.min(
    window.devicePixelRatio || 1,
    maxPixelRatio,
    Math.sqrt(1_500_000 / Math.max(1, width * height)),
  );
  return {
    width: Math.max(1, Math.floor(width * ratio)),
    height: Math.max(1, Math.floor(height * ratio)),
  };
}

export function createVisibleRenderLoop({
  element,
  draw,
  enabled = true,
  occludedBy,
}: {
  element: HTMLElement;
  draw: (time: number) => boolean;
  enabled?: boolean;
  occludedBy?: HTMLElement | null;
}) {
  const bounds = element.getBoundingClientRect();
  let visible = bounds.bottom > 0 && bounds.top < window.innerHeight;
  let frame = 0;
  let disposed = false;
  let occluded = occludedBy?.dataset.open === "true";

  function stop() {
    window.cancelAnimationFrame(frame);
    frame = 0;
  }

  function request() {
    if (!disposed && enabled && visible && !occluded && !document.hidden && !frame) {
      frame = window.requestAnimationFrame(tick);
    }
  }

  function tick(time: number) {
    frame = 0;
    if (!disposed && enabled && visible && !occluded && !document.hidden && draw(time)) request();
  }

  const observer = new IntersectionObserver(entries => {
    visible = entries[entries.length - 1]?.isIntersecting ?? false;
    if (visible) request();
    else stop();
  });
  observer.observe(element);

  const occlusionObserver = occludedBy ? new MutationObserver(() => {
    occluded = occludedBy.dataset.open === "true";
    if (occluded) stop();
    else request();
  }) : null;
  if (occludedBy) occlusionObserver?.observe(occludedBy, { attributes: true, attributeFilter: ["data-open"] });

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
      occlusionObserver?.disconnect();
      document.removeEventListener("visibilitychange", visibilityChanged);
    },
  };
}
