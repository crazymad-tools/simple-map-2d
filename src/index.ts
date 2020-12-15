// base on canvas 2d api
// change to webgl in future
// we use EPSG:3857 to calculate map

import "./style/index.css";
import { notAssert } from "./utils/asserts";
import { loadImage } from "./utils/image";
import proj4 from "proj4";
import Vec3 from "./core/Vec3";

// google map wmts tile image source url
// http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x=1&y=4&z=3&s=Gali

const TILE_SIZE = 256;
const TILE_CACHE_LIMIT = 100;
const CAMERA_MIN_HEIGHT = 1000;
const CAMERA_MAX_HEIGHT = 1000000;
const CAMERA_DEFAULT_FOV = Math.PI / 3;
const SEMI_MAJOR_AXIS = 6378137;

export enum TILE_STATUS {
  FAIL,
  SUCCESS,
  LOADING,
}

export type TileLevelInfo = {
  width: number;
  height: number;
  level: number;
};

const tileLevels: TileLevelInfo[] = new Array(20).fill(1).map((item, idx) => {
  let scale = Math.pow(2, idx);

  return {
    width: SEMI_MAJOR_AXIS / scale,
    height: SEMI_MAJOR_AXIS / scale,
    level: idx,
  };
});

class Tile {
  canvas: HTMLCanvasElement;

  initStamp: number;

  tileNo: Vec3;

  readyPromise: Promise<any>;

  status: number = TILE_STATUS.LOADING;

  constructor(No: Vec3, sourceUrl: string) {
    this.tileNo = No;
    this.readyPromise = this.initTile(sourceUrl);
  }

  async initTile(sourceUrl: string) {
    const image = await loadImage(sourceUrl);

    this.canvas = document.createElement("canvas");
    this.canvas.width = TILE_SIZE;
    this.canvas.height = TILE_SIZE;

    const context = this.canvas.getContext("2d");
    notAssert(context, null);
    context.drawImage(image, 0, 0, TILE_SIZE, TILE_SIZE);

    this.initStamp = new Date().getTime();

    // console.debug(this.canvas.toDataURL());
    // document.body.appendChild(this.canvas);
  }
}

/**
 * map state in each render
 */
class RenderFrame {
  update(camera: MapCamera) {
    const { fov, position, map } = camera;
    const { canvas, caches, context } = map;
    const { width: canvasWidth, height: canvasHeight } = canvas;

    // camera view width with metre
    const metreWidth = Math.atan(fov / 2) * position.z * 2;
    const metreHeight = metreWidth * (canvasHeight / canvasWidth);
    // console.log(metreWidth, metreHeight, position.x, position.y);

    // get the suited level to render
    let levelInfo: TileLevelInfo = tileLevels[0];
    for (let i = 0; i < tileLevels.length; i++) {
      levelInfo = tileLevels[i];
      if (metreWidth > levelInfo.width) {
        break;
      }
    }

    const tileSize = levelInfo.width;
    const west = position.x - metreWidth / 2;
    const east = position.x + metreWidth / 2;
    const north = position.y - metreHeight / 2;
    const south = position.y + metreHeight / 2;
    // console.log(west, east, north, south);

    const westX = Math.ceil(west / tileSize);
    const eastX = Math.ceil(east / tileSize);
    const northY = Math.ceil(north / tileSize);
    const southY = Math.ceil(south / tileSize);
    // console.log(tileSize, westX, eastX, northY, southY);

    // get tile and render
    const x = Math.floor(Math.pow(2, levelInfo.level) / 2);
    const y = Math.floor(Math.pow(2, levelInfo.level) / 2);
    const tileNo = new Vec3(x, y, levelInfo.level);
    const key = `${tileNo.z}-${tileNo.x}-${tileNo.y}`;

    const width = 256 / (metreWidth / levelInfo.width);
    const height = 256 / (metreWidth / levelInfo.width);
    if (caches[key]?.status === TILE_STATUS.SUCCESS) {
      let tile = caches[key];
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.drawImage(
        tile.canvas,
        // (canvasWidth - width) / 2,
        // (canvasHeight - height) / 2,
        canvasWidth / 2,
        canvasHeight / 2,
        width,
        height
      );
    } else if (!caches[key]) {
      map.loadTile(tileNo);
    }
  }
}

class MapCamera {
  position: Vec3 = new Vec3(0, 0, 0);

  fov: number = CAMERA_DEFAULT_FOV;

  frame: RenderFrame;

  map: BaseMap;

  constructor(map: BaseMap, frame: RenderFrame) {
    this.map = map;
    this.frame = frame;

    this.registerHandler();
  }

  setView(pos: Vec3) {
    const coors = proj4("EPSG:4326", "EPSG:3857", [pos.x, pos.y]);

    this.position.x = coors[0];
    this.position.y = coors[1];
    this.position.z = pos.z;

    this.frame.update(this);
  }

  /**
   * register user input action handler
   */
  registerHandler() {
    /**
     * handle mouse wheel scroll
     * control camera zoom in or zoom out
     */
    this.map.container.addEventListener("mousewheel", (e: WheelEvent) => {
      e.stopPropagation();
      const { deltaY } = e;

      if (deltaY < 0) {
        // camera zoom in
        this.position.z -= this.position.z / 100;
        this.position.z = Math.max(this.position.z, CAMERA_MIN_HEIGHT);
      } else {
        // camera zoom out
        this.position.z += this.position.z / 100;
        this.position.z = Math.min(this.position.z, CAMERA_MAX_HEIGHT);
      }

      this.frame.update(this);
    });

    /**
     * handle mouse drag event
     * control camera translate move
     */
  }
}

class BaseMap {
  /**
   * map canvas wrap container
   */
  container: HTMLElement;

  canvas: HTMLCanvasElement;

  context: CanvasRenderingContext2D;

  /**
   * web map tiles caches to reuse
   */
  caches: { [key: string]: Tile } = {};

  /**
   * web map tiles caches by array
   */
  cacheArray: Tile[] = [];

  /**
   * render state
   */
  frame: RenderFrame;

  /**
   * virtual map camera
   */
  camera: MapCamera;

  constructor(id: string) {
    this.initMap(id);

    this.frame = new RenderFrame();
    this.camera = new MapCamera(this, this.frame);
    this.camera.setView(new Vec3(0, 0, 100000));
  }

  /**
   * init the map canvas dom and get canvas context
   * @param id
   */
  initMap(id: string) {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");

    let container = document.getElementById(id);
    this.container = container;
    notAssert(container, null, "container dom has not found");

    container.appendChild(this.canvas);
    container.classList.add("map-container");
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
  }

  /**
   * @param No the unicode of tile
   */
  async loadTile(No: Vec3) {
    const url = `http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x=${No.x}&y=${No.y}&z=${No.z}&s=Gali`;
    const tile = new Tile(No, url);

    const count = Object.keys(this.caches).length;
    if (count > TILE_CACHE_LIMIT) {
      const no = this.cacheArray.shift().tileNo;
      const key = `${no.z}-${no.x}-${no.y}`;
      delete this.caches[key];
    }

    this.caches[`${No.z}-${No.x}-${No.y}`] = tile;
    this.cacheArray.push(tile);

    // map should render after new tile loaded
    tile.readyPromise
      .then(() => {
        tile.status = TILE_STATUS.SUCCESS;
        this.frame.update(this.camera);
      })
      .catch(() => {
        tile.status = TILE_STATUS.FAIL;
      });
  }
}

(window as any).BaseMap = BaseMap;

export default BaseMap;
