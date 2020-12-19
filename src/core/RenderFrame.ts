import { SEMI_MAJOR_AXIS, TILE_SIZE } from "src/constant/common";
import MapCamera from "./MapCamera";
import Tile, { TileLevelInfo, tileLevels } from "./TIle";
import Vec3 from "./Vec3";

function getXY(levelInfo: TileLevelInfo, x: number, y: number) {
  const max = Math.pow(2, levelInfo.level);
  let tileX = x;
  let tileY = y;
  // console.log("getXY", max, x, y);

  if (x < 0) {
    tileX = max + x;
  } else if (x >= max) {
    tileX = y - max;
  }

  if (y < 0) {
    tileY = max + y;
  } else if (y >= max) {
    tileY = y - max;
  }

  // console.log('getXY', levelInfo, x, y, tileX, tileY);
  return [tileX, tileY];
}

/**
 * map state in each render
 */
export default class RenderFrame {
  pixelRatio: number;

  update(camera: MapCamera) {
    const { fov, position, map } = camera;
    const { canvas, caches, context } = map;
    const { width: canvasWidth, height: canvasHeight } = canvas;

    context.clearRect(0, 0, canvasWidth, canvasHeight);

    // camera view width with metre
    const metreWidth = Math.atan(fov / 2) * position.z * 2;
    // size per pixel
    const pixelRatio = metreWidth / canvasWidth;
    this.pixelRatio = pixelRatio;

    // get the suited level to render
    let levelInfo: TileLevelInfo = tileLevels[0];
    for (let i = 0; i < tileLevels.length; i++) {
      levelInfo = tileLevels[i];
      if (pixelRatio > levelInfo.ratio) {
        break;
      }
    }

    const tileSize = levelInfo.width;
    const west = position.x - metreWidth / 2 + SEMI_MAJOR_AXIS / 2;
    const east = position.x + metreWidth / 2 + SEMI_MAJOR_AXIS / 2;
    const north = SEMI_MAJOR_AXIS / 2 - (position.y + metreWidth / 2);
    const south = SEMI_MAJOR_AXIS / 2 - (position.y - metreWidth / 2);

    const westX = Math.ceil(west / tileSize) - 1;
    const eastX = Math.ceil(east / tileSize) + 1;
    const northY = Math.ceil(north / tileSize) - 1;
    const southY = Math.ceil(south / tileSize) + 1;

    const tileSizeScale = pixelRatio / levelInfo.ratio;
    const size = TILE_SIZE / tileSizeScale;

    for (let x = westX; x <= eastX; x++) {
      for (let y = northY; y <= southY; y++) {
        let [tileX, tileY] = getXY(levelInfo, x, y);

        const tileNo = new Vec3(tileX, tileY, levelInfo.level);
        const key = `${tileNo.z}-${tileNo.x}-${tileNo.y}`;

        if (caches[key]?.status === Tile.TILE_STATUS.SUCCESS) {
          let left = x * levelInfo.width - SEMI_MAJOR_AXIS / 2;
          let top = SEMI_MAJOR_AXIS / 2 - y * levelInfo.width;
          let offsetX = (left - position.x) / pixelRatio + canvasWidth / 2;
          let offsetY = ((position.y - top) / pixelRatio + canvasHeight / 2);

          const tile = caches[key];
          context.drawImage(tile.canvas, offsetX, offsetY, size, size);
        } else if (!caches[key]) {
          map.loadTile(tileNo);
        }
      }
    }
  }
}
