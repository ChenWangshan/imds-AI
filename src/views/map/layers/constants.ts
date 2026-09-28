export type LayerGroup = "base" | "jobSite";

export type StyleMapEntry = {
  filter?: unknown[];
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
  minzoom?: number;
  maxzoom?: number;
};

export type StyleMap = Record<string, StyleMapEntry>;

export type BaseLayerDef = {
  key: string;
  label: string;
  jsonName: string;
  featureType: "polygon" | "line" | "point";
  code: string[];
  initBatchGroup: "small" | "solo";
  styleMap: StyleMap;
};

export type JobSiteLayerDef = {
  key: string;
  label: string;
  /** 取数方式 */
  fetchType:
    | "bizElement"
    | "bizElementForMonitor"
    | "unloadSlotPoint"
    | "queuePosition"
    | "temporaryParkingSpace"
    | "trackGuide";
  mapInfoType?: string;
  styleMap: StyleMap;
};

/** 与 eq-fleetcmder-web 一致的通用文字注记样式（text 子图层引用） */
export const commonTextStyle: StyleMapEntry = {
  filter: ["==", "$type", "Point"],
  layout: {
    "text-field": ["get", "name"],
    "text-anchor": "top",
    "text-justify": "center",
    "text-allow-overlap": false,
    "text-size": [
      "interpolate",
      ["linear"],
      ["zoom"],
      16,
      12,
      21,
      18,
    ],
  },
  paint: {
    "text-color": "#d4dff1",
  },
  minzoom: 14.439,
  maxzoom: 22,
};

export const baseLayerDefs: BaseLayerDef[] = [
  {
    key: "LOAD_AREA",
    label: "装载区",
    jsonName: "LOAD_AREA",
    featureType: "polygon",
    code: ["1"],
    initBatchGroup: "small",
    styleMap: {
      polygon: {
        paint: { "fill-color": "#273774", "fill-opacity": 0.3 },
      },
      line: { paint: { "line-color": "#18A59F", "line-width": 2 } },
      text: commonTextStyle,
    },
  },
  {
    key: "UNLOAD_AREA",
    label: "卸载区",
    jsonName: "UNLOAD_AREA",
    featureType: "polygon",
    code: ["2"],
    initBatchGroup: "small",
    styleMap: {
      polygon: {
        paint: { "fill-color": "#273774", "fill-opacity": 0.3 },
      },
      line: { paint: { "line-color": "#5DC4CE", "line-width": 2 } },
      text: commonTextStyle,
    },
  },
  {
    key: "JUNCTION",
    label: "路口",
    jsonName: "JUNCTION",
    featureType: "polygon",
    code: ["5"],
    initBatchGroup: "small",
    styleMap: {
      polygon: {
        paint: { "fill-color": "#3365A4", "fill-opacity": 0.3 },
      },
      line: { paint: { "line-color": "#5DBBFF", "line-width": 1 } },
    },
  },
  {
    key: "PARKING_LOT",
    label: "停车场",
    jsonName: "PARKING_LOT",
    featureType: "polygon",
    code: ["16"],
    initBatchGroup: "small",
    styleMap: {
      polygon: {
        paint: { "fill-color": "#3365A4", "fill-opacity": 0.3 },
      },
      line: { paint: { "line-color": "#5DBBFF", "line-width": 1 } },
      text: commonTextStyle,
    },
  },
  {
    key: "REFUEL_LOT",
    label: "加油场",
    jsonName: "REFUEL_LOT",
    featureType: "polygon",
    code: ["21"],
    initBatchGroup: "small",
    styleMap: {
      polygon: {
        paint: { "fill-color": "#3365A4", "fill-opacity": 0.3 },
      },
      line: { paint: { "line-color": "#5DBBFF", "line-width": 1 } },
      text: commonTextStyle,
    },
  },
  {
    key: "REFUEL_AREA",
    label: "加油区",
    jsonName: "REFUEL_AREA",
    featureType: "polygon",
    code: ["22"],
    initBatchGroup: "small",
    styleMap: {
      polygon: {
        paint: { "fill-color": "#3365A4", "fill-opacity": 0.3 },
      },
      line: { paint: { "line-color": "#5DBBFF", "line-width": 1 } },
      text: commonTextStyle,
    },
  },
  {
    key: "SPEED_LIMIT_AREA",
    label: "限速区",
    jsonName: "SPEED_LIMIT_AREA",
    featureType: "polygon",
    code: ["23"],
    initBatchGroup: "small",
    styleMap: {
      polygon: {
        paint: { "fill-color": "#D6A239", "fill-opacity": 0.05 },
      },
      line: { paint: { "line-color": "#BBBD26", "line-width": 1 } },
    },
  },
  {
    key: "FENCE_AREA",
    label: "围栏区",
    jsonName: "FENCE_AREA",
    featureType: "polygon",
    code: ["24"],
    initBatchGroup: "solo",
    styleMap: {
      line: { paint: { "line-color": "#AD5B38", "line-width": 1 } },
    },
  },
  {
    key: "LANE",
    label: "车道",
    jsonName: "LANE",
    featureType: "line",
    code: ["8"],
    initBatchGroup: "solo",
    styleMap: {
      line: {
        paint: { "line-color": "#D9E2F4", "line-width": 1 },
        minzoom: 1,
        maxzoom: 22,
      },
    },
  },
  {
    key: "CENTER_LANE",
    label: "车道中心线",
    jsonName: "CENTER_LANE",
    featureType: "line",
    code: ["8"],
    initBatchGroup: "solo",
    styleMap: {
      line: {
        paint: {
          "line-color": "#ffffff",
          "line-width": 1,
          "line-dasharray": [12, 6],
        },
        minzoom: 16,
        maxzoom: 22,
      },
    },
  },
  {
    key: "LANE_PHYSICAL_BOUNDARY",
    label: "车道物理边界",
    jsonName: "LANE_PHYSICAL_BOUNDARY",
    featureType: "line",
    code: ["6"],
    initBatchGroup: "small",
    styleMap: {
      line: {
        paint: { "line-color": "#D9E2F4", "line-width": 1 },
        minzoom: 1,
        maxzoom: 22,
      },
    },
  },
  {
    key: "VISITOR_STAND",
    label: "观礼台",
    jsonName: "VISITOR_STAND",
    featureType: "polygon",
    code: ["10"],
    initBatchGroup: "small",
    styleMap: {
      polygon: {
        paint: { "fill-color": "#E2F3FF", "fill-opacity": 0.2 },
      },
    },
  },
  {
    key: "TRAFFIC_ISLAND",
    label: "安全岛",
    jsonName: "TRAFFIC_ISLAND",
    featureType: "polygon",
    code: ["13"],
    initBatchGroup: "small",
    styleMap: {
      polygon: {
        paint: { "fill-color": "#E2F3FF", "fill-opacity": 0.2 },
      },
    },
  },
  {
    key: "SHOWER_ROOM",
    label: "淋水房",
    jsonName: "SHOWER_ROOM",
    featureType: "polygon",
    code: ["71"],
    initBatchGroup: "small",
    styleMap: {
      polygon: {
        paint: { "fill-color": "#842B8A", "fill-opacity": 0.18 },
      },
      line: { paint: { "line-color": "#842B8A", "line-width": 1 } },
    },
  },
  {
    key: "NARROW_AREA",
    label: "狭窄道路图层",
    jsonName: "NARROW_AREA",
    featureType: "polygon",
    code: ["26"],
    initBatchGroup: "small",
    styleMap: {
      polygon: {
        paint: { "fill-color": "#D19473", "fill-opacity": 0.2 },
      },
      line: { paint: { "line-color": "#D19473", "line-width": 1 } },
    },
  },
  {
    key: "DUMP_LINE",
    label: "排土线",
    jsonName: "DUMP_LINE",
    featureType: "line",
    code: ["7"],
    initBatchGroup: "solo",
    styleMap: {
      line: { paint: { "line-color": "#C3963D", "line-width": 3 } },
    },
  },
  {
    key: "SPEED_LIMIT_SIGN",
    label: "限速牌",
    jsonName: "SPEED_LIMIT_SIGN",
    featureType: "point",
    code: ["8"],
    initBatchGroup: "small",
    styleMap: {
      circle: {
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            16,
            7,
            22,
            20,
          ],
          "circle-color": "#ffffff",
          "circle-stroke-color": "#DF2653",
          "circle-stroke-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            16,
            2,
            22,
            4,
          ],
          "circle-opacity": 1,
        },
        minzoom: 16,
        maxzoom: 22,
      },
      text: {
        layout: {
          "text-field": ["get", "speed"],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-anchor": "center",
          "text-justify": "center",
          "text-allow-overlap": false,
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            16,
            8,
            22,
            20,
          ],
        },
        paint: {
          "text-color": "#243249",
          "text-halo-color": "#243249",
          "text-halo-width": 0.3,
        },
        minzoom: 16,
        maxzoom: 22,
      },
    },
  },
  {
    key: "OBSTACLE",
    label: "障碍物",
    jsonName: "OBSTACLE",
    featureType: "polygon",
    code: ["31"],
    initBatchGroup: "solo",
    styleMap: {
      polygon: {
        paint: { "fill-color": "red", "fill-opacity": 0.3 },
      },
      line: { paint: { "line-color": "red", "line-width": 1 } },
    },
  },
  {
    key: "PARKING_LINE",
    label: "停车线",
    jsonName: "PARKING_LINE",
    featureType: "line",
    code: ["82"],
    initBatchGroup: "small",
    styleMap: {
      line: { paint: { "line-color": "#C3963D", "line-width": 3 } },
    },
  },
  {
    key: "BUNKER",
    label: "料仓",
    jsonName: "BUNKER",
    featureType: "polygon",
    code: ["72"],
    initBatchGroup: "small",
    styleMap: {
      polygon: {
        paint: { "fill-color": "#273774", "fill-opacity": 0.3 },
      },
      line: { paint: { "line-color": "#18A59F", "line-width": 2 } },
      text: commonTextStyle,
    },
  },
  {
    key: "BATTERY_SWAP_STATION",
    label: "换电站",
    jsonName: "BATTERY_SWAP_STATION",
    featureType: "polygon",
    code: ["73"],
    initBatchGroup: "small",
    styleMap: {
      polygon: {
        paint: { "fill-color": "#273774", "fill-opacity": 0.3 },
      },
      line: { paint: { "line-color": "#18A59F", "line-width": 2 } },
      text: commonTextStyle,
    },
  },
  {
    key: "HEAP_LINE",
    label: "土堆线",
    jsonName: "HEAP_LINE",
    featureType: "line",
    code: ["44"],
    initBatchGroup: "small",
    styleMap: {
      line: { paint: { "line-color": "#8FC94D", "line-width": 2 } },
    },
  },
  {
    key: "GENERAL_AREA",
    label: "通用区",
    jsonName: "GENERAL_AREA",
    featureType: "polygon",
    code: ["67"],
    initBatchGroup: "small",
    styleMap: {
      polygon: {
        paint: { "fill-color": "#273774", "fill-opacity": 0.3 },
      },
      line: { paint: { "line-color": "#18A59F", "line-width": 2 } },
      text: commonTextStyle,
    },
  },
];

export const jobSiteLayerDefs: JobSiteLayerDef[] = [
  {
    key: "crushPosition",
    label: "破碎位",
    fetchType: "bizElement",
    mapInfoType: "7",
    styleMap: {
      polygon: {
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": [
            "match",
            ["get", "status"],
            "1",
            "#1AB394",
            "2",
            "#22D6FB",
            "3",
            "#E46565",
            "#1AB394",
          ],
          "fill-opacity": 0.3,
        },
        minzoom: 10,
        maxzoom: 22,
      },
      line: {
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": [
            "match",
            ["get", "status"],
            "1",
            "#1AB394",
            "2",
            "#22D6FB",
            "3",
            "#E46565",
            "#1AB394",
          ],
          "line-width": 1,
        },
        minzoom: 10,
        maxzoom: 22,
      },
    },
  },
  {
    key: "loadSlot",
    label: "装载位",
    fetchType: "bizElement",
    mapInfoType: "12",
    styleMap: {
      polygon: {
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": [
            "match",
            ["get", "type"],
            "0",
            "#ED9D3B",
            "#1ab394",
          ],
          "fill-opacity": 0.3,
        },
        minzoom: 10,
        maxzoom: 22,
      },
      line: {
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": [
            "match",
            ["get", "type"],
            "0",
            "#ED9D3B",
            "#1ab394",
          ],
          "line-width": 1,
        },
        minzoom: 10,
        maxzoom: 22,
      },
    },
  },
  {
    key: "unloadSlot",
    label: "卸载位",
    fetchType: "bizElementForMonitor",
    mapInfoType: "4",
    styleMap: {
      polygon: {
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": [
            "case",
            [
              "all",
              ["==", ["get", "status"], "3"],
              ["==", ["get", "dumpLineVersion"], "1"],
              ["==", ["get", "operateSource"], "0"],
            ],
            "red",
            [
              "match",
              ["get", "status"],
              "1",
              "#1ab394",
              "2",
              "#22D6FB",
              "3",
              "#e46565",
              "4",
              "#8E8E8E",
              "#1ab394",
            ],
          ],
          "fill-opacity": 0.3,
        },
        minzoom: 10,
        maxzoom: 22,
      },
      line: {
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": [
            "match",
            ["get", "status"],
            "1",
            "#1ab394",
            "2",
            "#22D6FB",
            "3",
            "#e46565",
            "4",
            "#8E8E8E",
            "#1ab394",
          ],
          "line-width": 1,
        },
        minzoom: 10,
        maxzoom: 22,
      },
      lock: {
        filter: [
          "all",
          ["==", "$type", "Point"],
          ["==", "lockState", "1"],
          ["==", "status", "2"],
        ],
        layout: {
          "icon-image": "lock-icon",
          "icon-anchor": "center",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            16,
            0.1,
            22,
            1.8,
          ],
          "icon-rotate": ["get", "rotation"],
        },
        paint: {},
        minzoom: 16,
        maxzoom: 22,
      },
    },
  },
  {
    key: "parkinkSpace",
    label: "停车位",
    fetchType: "bizElementForMonitor",
    mapInfoType: "10",
    styleMap: {
      polygon: {
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": [
            "match",
            ["get", "status"],
            "0",
            "#1ab394",
            "#e46565",
          ],
          "fill-opacity": 0.3,
        },
        minzoom: 10,
        maxzoom: 22,
      },
      line: {
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": [
            "match",
            ["get", "status"],
            "0",
            "#1ab394",
            "#e46565",
          ],
          "line-width": 1,
        },
        minzoom: 10,
        maxzoom: 22,
      },
      text: {
        filter: ["==", "$type", "Point"],
        layout: {
          "text-field": ["get", "useName"],
          "text-rotate": ["get", "angle"],
          "text-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            17,
            6,
            21,
            18,
          ],
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#fff",
          "text-halo-color": "rgba(255,0,0,0.2)",
          "text-halo-width": 2.0,
          "text-halo-blur": 0.8,
        },
        minzoom: 17,
        maxzoom: 22,
      },
    },
  },
  {
    key: "fuelSlot",
    label: "加油位",
    fetchType: "bizElement",
    mapInfoType: "14",
    styleMap: {
      polygon: {
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": [
            "match",
            ["get", "status"],
            "0",
            "#E46565",
            "#1AB394",
          ],
          "fill-opacity": 0.3,
        },
        minzoom: 10,
        maxzoom: 22,
      },
      line: {
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": [
            "match",
            ["get", "status"],
            "0",
            "#E46565",
            "#1AB394",
          ],
          "line-width": 1,
        },
        minzoom: 10,
        maxzoom: 22,
      },
    },
  },
  {
    key: "crushStation",
    label: "破碎口",
    fetchType: "bizElement",
    mapInfoType: "6",
    styleMap: {
      polygon: {
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": [
            "match",
            ["get", "status"],
            "1",
            "#1BB5FB",
            "3",
            "#FF4D2B",
            "#1BB5FB",
          ],
          "fill-opacity": 0.3,
        },
        minzoom: 10,
        maxzoom: 22,
      },
      line: {
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": [
            "match",
            ["get", "status"],
            "1",
            "#1BB5FB",
            "3",
            "#FF4D2B",
            "#1BB5FB",
          ],
          "line-width": 1,
        },
        minzoom: 10,
        maxzoom: 22,
      },
    },
  },
  {
    key: "unloadSlotPoint",
    label: "临时卸载位",
    fetchType: "unloadSlotPoint",
    styleMap: {
      polygon: {
        filter: ["==", "$type", "Polygon"],
        paint: { "fill-color": "#1ab394", "fill-opacity": 0.18 },
        minzoom: 10,
        maxzoom: 22,
      },
      line: {
        filter: ["==", "$type", "LineString"],
        paint: { "line-color": "#1ab394", "line-width": 1 },
        minzoom: 10,
        maxzoom: 22,
      },
    },
  },
  {
    key: "queuePosition",
    label: "排队位",
    fetchType: "queuePosition",
    styleMap: {
      polygon: {
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": [
            "match",
            ["get", "status"],
            1,
            "#1AB394",
            "#E46565",
          ],
          "fill-opacity": 0.3,
        },
        minzoom: 10,
        maxzoom: 22,
      },
      line: {
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": [
            "match",
            ["get", "status"],
            1,
            "#1AB394",
            "#E46565",
          ],
          "line-width": 1,
        },
        minzoom: 10,
        maxzoom: 22,
      },
    },
  },
  {
    key: "temporaryParkingSpace",
    label: "临时停车位",
    fetchType: "temporaryParkingSpace",
    styleMap: {
      polygon: {
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": [
            "match",
            ["get", "status"],
            1,
            "#1AB394",
            "#E46565",
          ],
          "fill-opacity": 0.3,
        },
        minzoom: 10,
        maxzoom: 22,
      },
      line: {
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": [
            "match",
            ["get", "status"],
            1,
            "#1AB394",
            "#E46565",
          ],
          "line-width": 1,
        },
        minzoom: 10,
        maxzoom: 22,
      },
    },
  },
  {
    key: "trackGuide",
    label: "轨迹指引",
    fetchType: "trackGuide",
    styleMap: {
      polygon: {
        filter: ["==", "$type", "Polygon"],
        paint: { "fill-color": "#7B8942", "fill-opacity": 0.6 },
      },
      line: {
        filter: ["==", "$type", "Polygon"],
        paint: { "line-color": "#BACE68", "line-width": 1.4 },
      },
      lineFill: {
        filter: ["==", "$type", "LineString"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#41FF7B", "line-width": 6 },
        minzoom: 16,
        maxzoom: 22,
      },
      lineBorder: {
        filter: ["==", "$type", "LineString"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#000000", "line-width": 8 },
        minzoom: 16,
        maxzoom: 22,
      },
      lineArrow: {
        filter: ["==", "$type", "LineString"],
        layout: {
          "symbol-placement": "line",
          "icon-image": "arrow-icon",
          "icon-size": 6 / 15,
          "symbol-spacing": 10,
        },
        minzoom: 16,
        maxzoom: 22,
      },
    },
  },
  {
    key: "crushingSite",
    label: "破碎场",
    fetchType: "bizElement",
    mapInfoType: "5",
    styleMap: {
      polygon: {
        paint: {
          "fill-color": [
            "match",
            ["get", "status"],
            "1",
            "#273774",
            "#e46565",
          ],
          "fill-opacity": 0.18,
        },
      },
      line: {
        paint: {
          "line-color": [
            "match",
            ["get", "status"],
            "1",
            "#5DC4CE",
            "#e46565",
          ],
          "line-width": 2,
        },
      },
      text: commonTextStyle,
    },
  },
  {
    key: "stackingArea",
    label: "堆排区",
    fetchType: "bizElementForMonitor",
    mapInfoType: "75",
    styleMap: {
      polygon: {
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": [
            "match",
            ["get", "status"],
            "1",
            "#BACE68",
            "2",
            "#22D6FB",
            "3",
            "#e46565",
            "#BACE68",
          ],
          "fill-opacity": 0.3,
        },
        minzoom: 10,
        maxzoom: 22,
      },
      line: {
        filter: ["==", "$type", "Polygon"],
        paint: {
          "line-color": [
            "match",
            ["get", "status"],
            "1",
            "#BACE68",
            "2",
            "#22D6FB",
            "3",
            "#e46565",
            "#BACE68",
          ],
          "line-width": 2,
        },
      },
      dumpedLine: {
        filter: ["==", ["get", "featureKind"], "dumpedLine"],
        paint: { "line-color": "#EF9800", "line-width": 4 },
        minzoom: 10,
        maxzoom: 22,
      },
      advancementLine: {
        filter: ["==", ["get", "featureKind"], "advancementLine"],
        paint: {
          "line-color": "#EA9502",
          "line-width": 2,
          "line-opacity": 1,
        },
        minzoom: 13,
        maxzoom: 22,
      },
      arrow: {
        filter: ["==", ["get", "featureKind"], "advancementArrow"],
        layout: {
          "icon-image": "stacking-area-advancement-arrow-icon",
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12,
            ["*", ["coalesce", ["get", "arrowScale"], 1], 0.03],
            13,
            ["*", ["coalesce", ["get", "arrowScale"], 1], 0.05],
            15,
            ["*", ["coalesce", ["get", "arrowScale"], 1], 0.08],
            16,
            ["*", ["coalesce", ["get", "arrowScale"], 1], 0.16],
            22,
            ["*", ["coalesce", ["get", "arrowScale"], 1], 1.4],
          ],
          "icon-rotate": ["get", "rotation"],
          "icon-rotation-alignment": "map",
          "icon-anchor": "bottom",
          "icon-offset": [0, 1],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
        minzoom: 13,
        maxzoom: 22,
      },
      baseline: {
        filter: ["==", ["get", "featureKind"], "baseline"],
        paint: {
          "line-color": "#FFD200",
          "line-width": 2,
          "line-opacity": 1,
        },
        minzoom: 13,
        maxzoom: 22,
      },
      baselineArrow: {
        filter: ["==", ["get", "featureKind"], "baselineArrow"],
        layout: {
          "icon-image": "stacking-area-baseline-arrow-icon-v2",
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12,
            ["*", ["coalesce", ["get", "arrowScale"], 1], 0.02],
            13,
            ["*", ["coalesce", ["get", "arrowScale"], 1], 0.04],
            15,
            ["*", ["coalesce", ["get", "arrowScale"], 1], 0.05],
            16,
            ["*", ["coalesce", ["get", "arrowScale"], 1], 0.12],
            22,
            ["*", ["coalesce", ["get", "arrowScale"], 1], 1.2],
          ],
          "icon-rotate": ["get", "rotation"],
          "icon-rotation-alignment": "map",
          "icon-anchor": "bottom",
          "icon-offset": [0, 1],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
        minzoom: 13,
        maxzoom: 22,
      },
    },
  },
];

export const SUB_LAYER_TYPE_MAP: Record<string, string> = {
  polygon: "fill",
  line: "line",
  text: "symbol",
  circle: "circle",
  lock: "symbol",
  lineFill: "line",
  lineBorder: "line",
  lineArrow: "symbol",
  wallLine: "line",
  dumpedLine: "line",
  advancementLine: "line",
  arrow: "symbol",
  baseline: "line",
  baselineArrow: "symbol",
  fill: "fill",
};

export const SUB_LAYER_LABEL_MAP: Record<string, string> = {
  polygon: "面",
  line: "线",
  text: "注记",
  circle: "点",
  lock: "锁定图标",
  lineFill: "线填充",
  lineBorder: "线描边",
  lineArrow: "线箭头",
  wallLine: "挡墙线",
  dumpedLine: "土堆线",
  advancementLine: "堆排方向线",
  arrow: "堆排方向箭头",
  baseline: "基准线",
  baselineArrow: "基准线箭头",
  fill: "面",
};
