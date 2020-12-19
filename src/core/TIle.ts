import { SEMI_MAJOR_AXIS, TILE_SIZE } from "src/constant/common";
import { notAssert } from "src/utils/asserts";
import { loadImage } from "src/utils/image";
import Vec3 from "./Vec3";

export enum TILE_STATUS {
  FAIL,
  SUCCESS,
  LOADING,
}

export type TileLevelInfo = {
  width: number;
  level: number;
  ratio: number;
};

export const tileLevels: TileLevelInfo[] = new Array(20)
  .fill(1)
  .map((item, idx) => {
    let scale = Math.pow(2, idx);

    return {
      width: SEMI_MAJOR_AXIS / scale,
      level: idx,
      ratio: SEMI_MAJOR_AXIS / scale / TILE_SIZE,
    };
  });

export default class Tile {
  static TILE_SIZE = TILE_SIZE;

  static TILE_STATUS = TILE_STATUS;

  static tileLevels = tileLevels;

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

    // context.font = '30px Arial';
    // context.fillStyle = '#ffffff';
    // context.fillText(`${this.tileNo.z}, ${this.tileNo.x}, ${this.tileNo.y}`, 0, 180);

    this.initStamp = new Date().getTime();

    // console.debug(this.canvas.toDataURL());
    // document.body.appendChild(this.canvas);
  }
}
