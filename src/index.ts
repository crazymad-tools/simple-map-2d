// base on canvas 2d api
// change to webgl in future
// we use EPSG:3857 to calculate map

import BaseMap from "./core/BaseMap";
import "./style/index.css";

// google map wmts tile image source url
// http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x=1&y=4&z=3&s=Gali

(window as any).BaseMap = BaseMap;

export default BaseMap;
