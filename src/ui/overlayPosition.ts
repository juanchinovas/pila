function isBodyPortal(portalTo: HTMLElement): boolean {
  return portalTo === document.body || portalTo === document.documentElement;
}

export function setPortalPosition(
  el: HTMLElement,
  portalTo: HTMLElement,
  x: number,
  y: number
): { x: number; y: number } {
  const pos = viewportPointToPortal(portalTo, x, y);
  el.style.left = `${pos.x}px`;
  el.style.top = `${pos.y}px`;
  return pos;
}

export function viewportPointToPortal(
  portalTo: HTMLElement,
  x: number,
  y: number
): { x: number; y: number } {
  if (isBodyPortal(portalTo)) {
    return {
      x: x + window.scrollX,
      y: y + window.scrollY,
    };
  }

  const rect = portalTo.getBoundingClientRect();
  return {
    x: x - rect.left,
    y: y - rect.top,
  };
}

export function portalViewportBounds(portalTo: HTMLElement): {
  left: number;
  top: number;
  right: number;
  bottom: number;
} {
  if (isBodyPortal(portalTo)) {
    return {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };
  }

  const rect = portalTo.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
  };
}