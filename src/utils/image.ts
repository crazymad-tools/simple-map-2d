export async function loadImage (url: string): Promise<HTMLImageElement> {
  let image = new Image();

  return new Promise((resolve, reject) => {
    image.src = url;
    image.crossOrigin = 'Anonymous';
    image.onload = () => {
      resolve(image);
    }
    image.onerror = () => {
      reject(new Error(`load image ${url} fail`));
    }
  })
}