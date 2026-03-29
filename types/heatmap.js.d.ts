declare module "heatmap.js" {
  interface HeatmapConfig {
    container: HTMLElement;
    radius?: number;
    maxOpacity?: number;
    minOpacity?: number;
    blur?: number;
  }
  interface HeatmapData {
    max: number;
    data: Array<{ x: number; y: number; value: number }>;
  }
  interface HeatmapInstance {
    setData(data: HeatmapData): void;
    addData(point: { x: number; y: number; value: number }): void;
  }
  function create(config: HeatmapConfig): HeatmapInstance;
  export default { create };
}
