import Vec3 from "./Vec3";
import proj4 from "proj4";
import BaseMap from "./BaseMap";
import RenderFrame from "./RenderFrame";
import {
  CAMERA_DEFAULT_FOV,
  CAMERA_MAX_HEIGHT,
  CAMERA_MIN_HEIGHT,
} from "src/constant/common";

export default class MapCamera {
  static CAMERA_DEFAULT_FOV = CAMERA_DEFAULT_FOV;
  static CAMERA_MIN_HEIGHT = CAMERA_MIN_HEIGHT;
  static CAMERA_MAX_HEIGHT = CAMERA_MAX_HEIGHT;

  position: Vec3 = new Vec3(0, 0, 0);

  fov: number = CAMERA_DEFAULT_FOV;

  frame: RenderFrame;

  map: BaseMap;

  status: "STATIC" | "MOVING";

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
    console.log("position", this.position);

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
    this.map.container.addEventListener("mousedown", (e) => {
      let last = {
        x: e.clientX,
        y: e.clientY,
      };

      const moving = (e: MouseEvent) => {
        const current = {
          x: e.clientX,
          y: e.clientY,
        };

        const movement = {
          x: current.x - last.x,
          y: current.y - last.y,
        };
        const { pixelRatio } = this.frame;
        this.position.update(
          this.position.x - movement.x * pixelRatio,
          this.position.y + movement.y * pixelRatio,
          this.position.z
        );
        this.frame.update(this);

        last = current;
      };

      const stop = () => {
        window.removeEventListener("mouseup", stop);
        window.removeEventListener('mousemove', moving);
      };

      window.addEventListener("mouseup", stop);
      window.addEventListener("mousemove", moving);
    });
  }
}
