import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { StyleMapEntry } from "./constants";

/** 与 eq-fleetcmder-web test12 环境一致的天地图 token */
const TDT_TOKEN = "24f053f3d41f3e2df373d25ed9d8fef7";
const GLYPHS_URL = "https://static.eqfleetcmder.com/font/{fontstack}/{range}.pbf";

const TDT_SOURCE_ID = "preview-tdt-img";
const TDT_LAYER_ID = "preview-tdt-img-layer";

export type FeatureCollection = {
  type: "FeatureCollection";
  features: unknown[];
};

export type PreviewSubLayer = {
  id: string;
  maplibreType: "fill" | "line" | "symbol" | "circle";
  def: StyleMapEntry;
};

export type PreviewItem = {
  sourceId: string;
  data: FeatureCollection;
  layers: PreviewSubLayer[];
};

const createSvgImage = (svg: string): Promise<ImageBitmap | HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve(img);
      URL.revokeObjectURL(url);
    };
    img.onerror = (e) => {
      reject(e);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });

const LOCK_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
  <rect x="4" y="10" width="16" height="11" rx="2" fill="#FFB902"/>
  <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#FFB902" stroke-width="2.6"/>
</svg>`;

const ARROW_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 1088 1024">
  <path d="M478.592 855.872H334.08l285.12-329.408-286.592-356.608h157.44l295.808 359.68-307.328 326.336z" fill="#000000"/>
</svg>`;

const triangleSvg = (color: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <path d="M24 0 L48 48 L0 48 Z" fill="${color}"/>
</svg>`;

export class LayerPreviewMap {
  private map: maplibregl.Map | null = null;

  private showBasemap = false;

  private center: [number, number] = [116.3912, 39.9073];

  private resizeObserver: ResizeObserver | null = null;

  async init(container: HTMLElement, opts?: { center?: [number, number]; showBasemap?: boolean }) {
    this.center = opts?.center ?? this.center;
    this.showBasemap = opts?.showBasemap ?? this.showBasemap;

    this.destroy();

    const map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        name: "layer-preview",
        sources: {},
        layers: [],
        glyphs: GLYPHS_URL,
      },
      center: this.center,
      zoom: 14,
      maxPitch: 0,
      dragRotate: false,
      doubleClickZoom: false,
    });

    map.touchZoomRotate?.disableRotation?.();

    await new Promise<void>((resolve) => map.once("load", () => resolve()));

    // 容器此时可能尚未完成布局（宽高为 0），等待容器有尺寸后再触发 resize，
    // 否则瓦片不会按真实尺寸请求，底图渲染不出来
    await this.waitForContainerSize(container);
    map.resize();

    await this.addImages(map);

    this.map = map;

    if (this.showBasemap) {
      this.addBasemap();
    }

    map.triggerRepaint?.();

    this.observeContainerResize(container, map);
  }

  private waitForContainerSize(container: HTMLElement) {
    return new Promise<void>((resolve) => {
      const check = () => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          resolve();
          return;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }

  private observeContainerResize(container: HTMLElement, map: maplibregl.Map) {
    this.resizeObserver?.disconnect();
    if (typeof ResizeObserver === "undefined") return;

    this.resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    this.resizeObserver.observe(container);
  }

  private async addImages(map: maplibregl.Map) {
    const images: [string, string][] = [
      ["lock-icon", LOCK_ICON_SVG],
      ["arrow-icon", ARROW_ICON_SVG],
      ["stacking-area-advancement-arrow-icon", triangleSvg("#EA9502")],
      ["stacking-area-baseline-arrow-icon-v2", triangleSvg("#FFD200")],
    ];

    await Promise.all(
      images.map(async ([id, svg]) => {
        if (map.hasImage(id)) return;
        try {
          const image = await createSvgImage(svg);
          if (!map.hasImage(id)) map.addImage(id, image);
        } catch {
          // 图标加载失败不阻塞预览
        }
      }),
    );
  }

  private addBasemap() {
    const map = this.map;
    if (!map) return;

    if (!map.getSource(TDT_SOURCE_ID)) {
      map.addSource(TDT_SOURCE_ID, {
        type: "raster",
        tiles: new Array(8).fill("").map(
          (_, index) =>
            `https://t${index}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TDT_TOKEN}`,
        ),
        tileSize: 256,
        minzoom: 1,
        maxzoom: 18,
      });
    }

    if (!map.getLayer(TDT_LAYER_ID)) {
      // 底图始终置于最底层：插入到当前第一个图层之前
      const bottomLayerId = (map.getStyle().layers ?? []).find(
        (layer) => layer.id !== TDT_LAYER_ID,
      )?.id;
      map.addLayer(
        {
          id: TDT_LAYER_ID,
          type: "raster",
          source: TDT_SOURCE_ID,
          layout: { visibility: "visible" },
        },
        bottomLayerId,
      );
    }

    map.triggerRepaint?.();
  }

  private removeBasemap() {
    const map = this.map;
    if (!map) return;
    if (map.getLayer(TDT_LAYER_ID)) map.removeLayer(TDT_LAYER_ID);
    if (map.getSource(TDT_SOURCE_ID)) map.removeSource(TDT_SOURCE_ID);
  }

  setBasemap(show: boolean) {
    this.showBasemap = show;
    if (!this.map) return;
    if (show) this.addBasemap();
    else this.removeBasemap();
    this.map.triggerRepaint?.();
  }

  clearLayers() {
    const map = this.map;
    if (!map) return;

    const layers = map.getStyle().layers ?? [];
    layers.forEach((layer) => {
      if (layer.id !== TDT_LAYER_ID && map.getLayer(layer.id)) {
        try {
          map.removeLayer(layer.id);
        } catch {
          // ignore
        }
      }
    });

    const sources = map.getStyle().sources ?? {};
    Object.keys(sources).forEach((sourceId) => {
      if (sourceId === TDT_SOURCE_ID) return;
      try {
        map.removeSource(sourceId);
      } catch {
        // ignore
      }
    });
  }

  render(items: PreviewItem[]) {
    const map = this.map;
    if (!map) return;

    this.clearLayers();

    const allBounds: number[][] = [];

    items.forEach((item) => {
      if (map.getSource(item.sourceId)) {
        try {
          map.removeSource(item.sourceId);
        } catch {
          // ignore
        }
      }
      map.addSource(item.sourceId, {
        type: "geojson",
        data: item.data as never,
      });

      (item.data?.features || []).forEach((feature) => {
        const geometry = (feature as { geometry?: { type?: string; coordinates?: unknown } })?.geometry;
        const type = geometry?.type;
        const coords = geometry?.coordinates as
          | number[]
          | number[][]
          | number[][][]
          | number[][][][]
          | undefined;
        if (!coords) return;

        const flat: number[][] = [];
        const walk = (node: unknown) => {
          if (!Array.isArray(node)) return;
          if (node.length === 2 && typeof node[0] === "number" && typeof node[1] === "number") {
            flat.push([node[0], node[1]]);
            return;
          }
          node.forEach((child) => walk(child));
        };
        if (type === "Point" || type === "LineString" || type === "Polygon" || type === "MultiPoint" || type === "MultiLineString" || type === "MultiPolygon") {
          walk(coords);
        }
        allBounds.push(...flat);
      });

      item.layers.forEach((subLayer) => {
        const { id, maplibreType, def } = subLayer;
        if (map.getLayer(id)) {
          try {
            map.removeLayer(id);
          } catch {
            // ignore
          }
        }

        const layerDef: Record<string, unknown> = {
          id,
          type: maplibreType,
          source: item.sourceId,
        };
        if (def.filter) layerDef.filter = def.filter;
        if (def.minzoom != null) layerDef.minzoom = def.minzoom;
        if (def.maxzoom != null) layerDef.maxzoom = def.maxzoom;
        if (def.layout) layerDef.layout = { ...def.layout };
        if (def.paint) layerDef.paint = { ...def.paint };
        if (maplibreType === "fill" && def.paint) {
          layerDef.paint = { "fill-antialias": false, ...(def.paint as object) };
        }

        map.addLayer(layerDef as never);
      });
    });

    if (allBounds.length) {
      try {
        const bounds = allBounds.reduce(
          (acc, [lng, lat]) => {
            if (!Number.isFinite(lng) || !Number.isFinite(lat)) return acc;
            return [
              Math.min(acc[0], lng),
              Math.min(acc[1], lat),
              Math.max(acc[2], lng),
              Math.max(acc[3], lat),
            ] as [number, number, number, number];
          },
          [180, 90, -180, -90] as [number, number, number, number],
        );
        map.fitBounds(bounds as [number, number, number, number], {
          padding: 60,
          duration: 400,
          maxZoom: 18,
        });
      } catch {
        // 忽略范围计算异常
      }
    }
  }

  getMap() {
    return this.map;
  }

  destroy() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (this.map) {
      try {
        this.map.remove();
      } catch {
        // ignore
      }
      this.map = null;
    }
  }
}
