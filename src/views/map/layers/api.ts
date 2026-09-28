import axios from "axios";

import type { JobSiteLayerDef } from "./constants";

export type EqFleetConnection = {
  token: string;
  mapId: string;
  orgId: string;
  userOrgId: string;
};

export type EqFleetMine = {
  mapId: string;
  [key: string]: unknown;
};

type FeatureCollection = {
  type: "FeatureCollection";
  features: unknown[];
};

type Envelope<T = unknown> = {
  code?: string | number;
  data?: T;
  resultMsg?: string;
};

const EQFLEET_TOKEN_KEY = "eqfleet-layer-token";
const EQFLEET_CONN_KEY = "eqfleet-layer-connection";

const client = axios.create({
  baseURL: "/eqfleet",
  timeout: 60000,
});

/** HTTP header 仅支持 ISO-8859-1，去除 token 中粘贴带入的不可见/非 ASCII 字符 */
const sanitizeToken = (token: string) => token.replace(/[^\x20-\x7E]/g, "").trim();

client.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  const token = sanitizeToken(readStoredEqToken());
  if (token) config.headers.token = token;
  return config;
});

export function readStoredEqToken() {
  try {
    return sanitizeToken(window.localStorage.getItem(EQFLEET_TOKEN_KEY) || "");
  } catch {
    return "";
  }
}

export function storeEqToken(token: string) {
  window.localStorage.setItem(EQFLEET_TOKEN_KEY, sanitizeToken(token));
}

export function readStoredEqConnection(): Partial<EqFleetConnection> {
  try {
    const raw = window.localStorage.getItem(EQFLEET_CONN_KEY);
    return raw ? (JSON.parse(raw) as Partial<EqFleetConnection>) : {};
  } catch {
    return {};
  }
}

export function storeEqConnection(conn: Partial<EqFleetConnection>) {
  window.localStorage.setItem(EQFLEET_CONN_KEY, JSON.stringify(conn));
}

async function postEnvelope<T>(
  url: string,
  params: unknown,
): Promise<T> {
  const res = await client.post<Envelope<T>>(url, params);
  const body = res.data ?? {};
  const code = body.code;
  if (code !== "200" && code !== 200 && code !== "0" && code !== 0 && code !== "success") {
    throw new Error((body as { resultMsg?: string }).resultMsg || `接口调用失败 (${String(code)})`);
  }
  return body.data as T;
}

/** 矿区列表（用于根据 orgId 拉取 mapId） */
export function fetchEqMineList(conn: EqFleetConnection) {
  return postEnvelope<EqFleetMine[]>("/v1/mineArea/queryMineAreaList", {
    equal: { orgId: conn.orgId },
  });
}

/** 基础图层数据：按 jsonName 批量拉取 */
export function fetchBaseLayerData(
  conn: EqFleetConnection,
  jsonNames: string[],
): Promise<Record<string, FeatureCollection>> {
  return postEnvelope<Record<string, FeatureCollection>>(
    "/geoserverLayer/queryMapDataByType",
    { mapId: conn.mapId, code: jsonNames },
  );
}

function postBizElement(conn: EqFleetConnection, def: JobSiteLayerDef, forMonitor: boolean) {
  const url = forMonitor
    ? "/v1/mapBiz/listMapBizElementForMonitor"
    : "/v1/mapBiz/listMapBizElement";
  return postEnvelope<{ mapElementDetail?: unknown[] }>(url, {
    mapId: conn.mapId,
    orgId: conn.orgId,
    mapInfoType: def.mapInfoType,
  });
}

/** 功能区图层数据：按图层定义拉取 */
export async function fetchJobSiteLayerData(
  conn: EqFleetConnection,
  def: JobSiteLayerDef,
): Promise<unknown[]> {
  switch (def.fetchType) {
    case "bizElement":
    case "bizElementForMonitor": {
      const res = await postBizElement(
        conn,
        def,
        def.fetchType === "bizElementForMonitor",
      );
      return res?.mapElementDetail || [];
    }
    case "unloadSlotPoint": {
      const res = await postEnvelope<unknown[]>("/v1/temporaryUnloadArea/list", {
        mapId: conn.mapId,
        orgId: conn.orgId,
        userOrgId: conn.userOrgId,
      });
      return Array.isArray(res) ? res : [];
    }
    case "queuePosition":
    case "temporaryParkingSpace": {
      const res = await postEnvelope<unknown[]>("/v1/functional/listFunctionalPositions", {
        orgId: conn.orgId,
        userOrgId: conn.userOrgId,
        type: def.fetchType === "queuePosition" ? 1 : 2,
      });
      return Array.isArray(res) ? res : [];
    }
    case "trackGuide": {
      const res = await postEnvelope<unknown[]>("/v1/functional/listAvailableFunctionalPositions", {
        types: [3, 4],
        mapId: conn.mapId,
      });
      return Array.isArray(res) ? res : [];
    }
    default:
      return [];
  }
}

/* ------------------------------ GeoJSON 转换 ------------------------------ */

type RawItem = {
  coordinate?: string;
  coordinates?: string;
  [key: string]: unknown;
};

export type JobSiteRawItem = RawItem;

const isSameLngLat = (a: number[], b: number[]) =>
  Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];

const closeRing = (ring: number[][]) => {
  if (!Array.isArray(ring) || ring.length < 2 || !ring[0]) return;
  if (!isSameLngLat(ring[0], ring[ring.length - 1])) {
    ring.push(ring[0]);
  }
};

const closePolygonGeometry = (geometry: { type: string; coordinates: unknown }) => {
  const { type, coordinates } = geometry || {};
  if (type === "Polygon") {
    ((coordinates as number[][][]) || []).forEach(closeRing);
  } else if (type === "MultiPolygon") {
    ((coordinates as number[][][][]) || []).forEach((polygon) =>
      polygon?.forEach(closeRing),
    );
  }
};

const parseLngLatCoordinate = (coordinate?: string): [number, number][] => {
  if (!coordinate) return [];
  return coordinate
    .split("#")
    .map((item) => {
      const parts = item.split(",").map((i) => Number(i.trim()));
      return [parts[0], parts[1]] as [number, number];
    })
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));
};

const getPolygonCenterCoordinate = (polygonLngLats: number[][][]) => {
  const ring = polygonLngLats[0] || [];
  const sum = ring.reduce(
    (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
    [0, 0],
  );
  const count = ring.length || 1;
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Point" as const,
      coordinates: [sum[0] / count, sum[1] / count],
    },
  };
};

/** 基础图层数据源构造：面图层补充质心注记点 */
export const generateBaseLayerDataSource = (
  geojsonData: FeatureCollection,
  featureType: "polygon" | "line" | "point",
): FeatureCollection => {
  if (featureType !== "polygon") return geojsonData;

  const pointFeatures: unknown[] = [];
  const features = (geojsonData?.features || []) as {
    geometry?: { type?: string };
    properties?: Record<string, unknown>;
  }[];

  features.forEach((feature) => {
    closePolygonGeometry(feature?.geometry as { type: string; coordinates: unknown });
    if (feature?.properties?.name) {
      const ring = ((feature.geometry?.type === "Polygon"
        ? (feature.geometry as unknown as { coordinates: number[][][] }).coordinates
        : [[[0, 0]]]) || [[[0, 0]]]) as number[][][];
      const pointFeature = getPolygonCenterCoordinate(ring);
      pointFeature.properties = feature.properties;
      pointFeatures.push(pointFeature);
    }
  });

  return {
    type: "FeatureCollection",
    features: [...features, ...pointFeatures],
  };
};

/** 由中心点 + 方位角 + 线长（米）推算终点（haversine 近似） */
const destinationPoint = (
  [lng, lat]: [number, number],
  rotationDeg: number,
  lengthM: number,
): [number, number] => {
  const earthRad = 6378137;
  const rad = (rotationDeg * Math.PI) / 180;
  const d = lengthM / earthRad;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(rad),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(rad) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    );
  return [(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI];
};

/** 两点间方位角（度，正北顺时针） */
const bearingBetween = (
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number],
) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const toDeg = (v: number) => (v * 180) / Math.PI;
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.cos(toRad(lng2 - lng1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const parseCenterPoint = (centerPoint?: unknown): [number, number] | null => {
  if (centerPoint == null) return null;
  const parts =
    typeof centerPoint === "string"
      ? centerPoint.split(",").map((i) => Number(i.trim()))
      : (centerPoint as number[]);
  if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return null;
  }
  const [lng, lat] = parts;
  if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;
  return [lng, lat];
};

const parseRefPoint = (value?: unknown): [number, number] | null => {
  if (value == null || value === "") return null;
  const parts = String(value).split(",").map((i) => Number(i.trim()));
  if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return null;
  }
  const [lng, lat] = parts;
  if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;
  return [lng, lat];
};

const resolveStackingAreaArrowScale = (polygonLngLats: number[][][]) => {
  const ring = polygonLngLats?.[0];
  if (!ring?.length) return 1;
  try {
    const lngs = ring.map((p) => p[0]);
    const lats = ring.map((p) => p[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const midLat = (minLat + maxLat) / 2;
    const widthM = Math.abs(maxLng - minLng) * 111320 * Math.cos((midLat * Math.PI) / 180);
    const heightM = Math.abs(maxLat - minLat) * 110540;
    const shortSideM = Math.min(widthM, heightM);
    if (!Number.isFinite(shortSideM) || shortSideM <= 0) return 1;
    const scale = shortSideM / 50;
    return Number(Math.min(3, Math.max(0.25, scale)).toFixed(2));
  } catch {
    return 1;
  }
};

const generateStackingAreaGeojsonData = (datas: RawItem[]): FeatureCollection => {
  const features: unknown[] = [];
  if (!datas?.length) return { type: "FeatureCollection", features: [] };

  const pushDirectedLineArrow = (opts: {
    centerLngLat: [number, number];
    rotation: number;
    lengthM: number;
    lineKind: string;
    arrowKind: string;
    baseProperties: Record<string, unknown>;
    arrowScale: number;
  }) => {
    const { centerLngLat, rotation, lengthM, lineKind, arrowKind, baseProperties, arrowScale } = opts;
    if (!Number.isFinite(rotation) || !Number.isFinite(lengthM) || lengthM <= 0) return;
    const endLngLat = destinationPoint(centerLngLat, rotation, lengthM);
    features.push({
      type: "Feature",
      properties: { ...baseProperties, featureKind: lineKind, showPopup: false },
      geometry: { type: "LineString", coordinates: [centerLngLat, endLngLat] },
    });
    features.push({
      type: "Feature",
      properties: { ...baseProperties, featureKind: arrowKind, rotation, arrowScale, showPopup: false },
      geometry: { type: "Point", coordinates: endLngLat },
    });
  };

  datas.forEach((item) => {
    const {
      coordinate,
      dumpedLineVOList = [],
      advancementDirection,
      name,
      status,
      serialNumber,
      id,
      mapElementId,
      mapInfoType,
      referenceStart,
      referenceEnd,
      centerPoint,
    } = item as RawItem & {
      dumpedLineVOList?: { coordinate?: string }[];
      advancementDirection?: number | string | null;
      referenceStart?: string | null;
      referenceEnd?: string | null;
      centerPoint?: unknown;
    };

    const baseProperties: Record<string, unknown> = {
      id,
      mapElementId,
      mapInfoType,
      name,
      status,
      serialNumber,
      layerName: "stackingArea",
    };

    let polygonLngLats: number[][][] = [];
    if (coordinate) {
      const lngLats = parseLngLatCoordinate(coordinate);
      if (lngLats.length) {
        const lineLngLats = [...lngLats, lngLats[0]];
        polygonLngLats = [lineLngLats];
        features.push({
          type: "Feature",
          properties: { ...baseProperties, featureKind: "area", showPopup: true },
          geometry: { type: "Polygon", coordinates: polygonLngLats },
        });
      }
    }

    (dumpedLineVOList as { coordinate?: string }[]).forEach((lineItem) => {
      if (!lineItem?.coordinate) return;
      const lineLngLats = parseLngLatCoordinate(lineItem.coordinate);
      if (!lineLngLats.length) return;
      features.push({
        type: "Feature",
        properties: { ...baseProperties, featureKind: "dumpedLine", showPopup: true },
        geometry: { type: "LineString", coordinates: lineLngLats },
      });
    });

    const centerLngLat = parseCenterPoint(centerPoint);
    const arrowScale = resolveStackingAreaArrowScale(polygonLngLats);

    if (centerLngLat && advancementDirection != null) {
      pushDirectedLineArrow({
        centerLngLat,
        rotation: Number(advancementDirection) || 0,
        lengthM: 3,
        lineKind: "advancementLine",
        arrowKind: "advancementArrow",
        baseProperties,
        arrowScale,
      });
    }

    const baselineStart = parseRefPoint(referenceStart);
    const baselineEnd = parseRefPoint(referenceEnd);
    if (centerLngLat && baselineStart && baselineEnd) {
      const rotation = bearingBetween(baselineStart, baselineEnd);
      if (Number.isFinite(rotation)) {
        pushDirectedLineArrow({
          centerLngLat,
          rotation,
          lengthM: 1.5,
          lineKind: "baseline",
          arrowKind: "baselineArrow",
          baseProperties,
          arrowScale: Number((arrowScale * 0.85).toFixed(2)),
        });
      }
    }
  });

  return { type: "FeatureCollection", features };
};

const generateTrackGuideGeojsonData = (datas: RawItem[]): FeatureCollection => {
  const features: unknown[] = [];
  datas.forEach((data) => {
    const { type, coordinates } = data as { type?: string; coordinates?: string };
    const lngLats = (coordinates || "").split("#").map((item) =>
      item.split(",").map((i) => Number(i)),
    );
    if (type === "3") {
      features.push({
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [lngLats] },
      });
    }
    if (type === "4") {
      features.push({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: lngLats },
      });
    }
  });
  return { type: "FeatureCollection", features };
};

/** 功能区图层数据源构造（含轨迹指引 / 堆排区特殊处理） */
export const generateJobSiteGeojsonData = (
  jsonName: string,
  datas: RawItem[],
): FeatureCollection => {
  if (jsonName === "trackGuide") return generateTrackGuideGeojsonData(datas);
  if (jsonName === "stackingArea") return generateStackingAreaGeojsonData(datas);

  const features: unknown[] = [];
  if (!datas || !datas.length) return { type: "FeatureCollection", features: [] };

  datas.forEach((data) => {
    const { coordinate, coordinates, ...restData } = data;
    let lngLats: number[][] = [];

    if (["queuePosition", "temporaryParkingSpace"].includes(jsonName)) {
      lngLats = (coordinates || "").split("#").map((item) =>
        item.split(",").map((i) => Number(i)),
      );
    } else if (jsonName === "unloadSlotPoint") {
      const raw = coordinates || coordinate || "";
      if (!raw) return;
      lngLats = raw.split("#").map((item) => item.split(",").map((i) => Number(i)));
    } else {
      lngLats = (coordinate || "").split("#").map((item) =>
        item.split(",").map((i) => Number(i)),
      );
    }

    const lineLngLats = [...lngLats, lngLats[0]];
    const polygonLngLats = [lineLngLats];

    if (jsonName === "unloadSlot") {
      try {
        const pointFeature = getPolygonCenterCoordinate(polygonLngLats);
        const rotation = Math.atan2(
          lineLngLats[1]?.[1] - lineLngLats[0]?.[1],
          lineLngLats[1]?.[0] - lineLngLats[0]?.[0],
        );
        pointFeature.properties = {
          rotation,
          lockState: data.lockState,
          status: data.status,
        };
        features.push(pointFeature);
      } catch {
        // 忽略锁图标中心点计算失败
      }
    }

    features.push({
      type: "Feature",
      properties: { ...data, layerName: jsonName, showPopup: true },
      geometry: { type: "Polygon", coordinates: polygonLngLats },
    });

    features.push({
      type: "Feature",
      properties: { ...restData },
      geometry: { type: "LineString", coordinates: lineLngLats },
    });

    if (jsonName === "parkinkSpace") {
      const courseAngle = Number(data.courseAngle ?? 0);
      const angle = courseAngle > 180 ? courseAngle - 180 : courseAngle;
      const pointFeature = getPolygonCenterCoordinate(polygonLngLats);
      const textLngLat = pointFeature?.geometry?.coordinates || [];
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: textLngLat },
        properties: {
          useName: Array.isArray(data.useTypes) ? data.useTypes.join(";") : (data.useTypes ?? ""),
          angle: angle - 90,
        },
      });
    }

    if (jsonName === "crushingSite") {
      const { name, centerPoint } = data;
      const textLngLat = String(centerPoint || "").split(",");
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: textLngLat },
        properties: { name },
      });
    }
  });

  return { type: "FeatureCollection", features };
};
