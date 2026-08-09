export type GlassShapeType = "rounded" | "circle" | "pill";

export interface GlassControls {
  edgeIntensity: number;
  rimIntensity: number;
  blurRadius: number;
  tintOpacity: number;
  tintColor?: string;
  mergeRate?: number;
  baseIntensity?: number;
  edgeDistance?: number;
  rimDistance?: number;
  baseDistance?: number;
  cornerBoost?: number;
  rippleEffect?: number;
}

export interface ContainerOptions {
  borderRadius?: number;
  type?: GlassShapeType;
  tintOpacity?: number;
}

export interface ButtonOptions {
  text?: string;
  size?: number;
  type?: GlassShapeType;
  tintOpacity?: number;
  warp?: boolean;
  onClick?: (text: string) => void;
}

export interface GlassInstance {
  element: HTMLElement;
  canvas: HTMLCanvasElement | null;
  gl_refs?: {
    gl?: WebGLRenderingContext;
    edgeIntensityLoc?: WebGLUniformLocation | null;
    rimIntensityLoc?: WebGLUniformLocation | null;
    blurRadiusLoc?: WebGLUniformLocation | null;
    tintOpacityLoc?: WebGLUniformLocation | null;
    [key: string]: unknown;
  };
  render?: () => void;
  parent?: GlassContainerInstance | null;
  children?: GlassChildInstance[];
  updateSizeFromDOM?: () => void;
  setupAsNestedGlass?: () => void;
  isNestedGlass?: boolean;
}

export type GlassChildInstance = GlassInstance & {
  setupAsNestedGlass?: () => void;
};

export interface GlassContainerInstance extends GlassInstance {
  children: GlassChildInstance[];
  addChild: (child: GlassChildInstance) => GlassChildInstance;
  removeChild: (child: GlassChildInstance) => void;
  updateSizeFromDOM: () => void;
}

export interface GlassButtonInstance extends GlassContainerInstance {
  text: string;
  fontSize: number;
  onClick: ((text: string) => void) | null;
  warp: boolean;
}

declare global {
  interface Window {
    glassControls?: GlassControls;
    html2canvas?: (element: HTMLElement, options?: object) => Promise<HTMLCanvasElement>;
    Container?: new (options?: ContainerOptions) => GlassContainerInstance;
    Button?: new (options?: ButtonOptions) => GlassButtonInstance;
  }
}
