class Vec3 {
  x: number;
  y: number;
  z: number;

  constructor (x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  updateX (x: number) {
    this.x = x;
  }

  updateY (y: number) {
    this.y = y;
  }

  updateZ (z: number) {
    this.z = z;
  }

  update (x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

export default Vec3;
