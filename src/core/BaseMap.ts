import { TILE_CACHE_LIMIT } from "src/constant/common";
import { notAssert } from "src/utils/asserts";
import MapCamera from "./MapCamera";
import RenderFrame from "./RenderFrame";
import Tile from "./TIle";
import Vec3 from "./Vec3";


export default class BaseMap {
  static TILE_CACHE_LIMIT = TILE_CACHE_LIMIT;

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
    this.camera.setView(new Vec3(108, 30, 1000000));
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

    // const count = Object.keys(this.caches).length;
    // if (count > TILE_CACHE_LIMIT) {
    //   const no = this.cacheArray.shift().tileNo;
    //   const key = `${no.z}-${no.x}-${no.y}`;
    //   delete this.caches[key];
    // }

    this.caches[`${No.z}-${No.x}-${No.y}`] = tile;
    this.cacheArray.push(tile);

    // map should render after new tile loaded
    tile.readyPromise
      .then(() => {
        tile.status = Tile.TILE_STATUS.SUCCESS;
        this.frame.update(this.camera);
      })
      .catch(() => {
        tile.status = Tile.TILE_STATUS.FAIL;
      });
  }
}
