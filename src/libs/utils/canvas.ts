import { Bitmap } from './bitmap';

export type CanvasConfigs = {
  width: number;
  height: number;
};

/**
 * 画布，只能画单个像素，模拟屏幕显示器
 */
export class Canvas {
  private ele: HTMLCanvasElement;
  public context: CanvasRenderingContext2D;
  constructor(ele: HTMLCanvasElement) {
    const context = ele?.getContext('2d') as CanvasRenderingContext2D;

    this.ele = ele;
    this.context = context;

    this.context.save();

    this.context.fillStyle = `rgb(255, 255, 255)`;
    this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

    this.context.restore();
  }

  get width() {
    return this.ele.width;
  }

  get height() {
    return this.ele.height;
  }

  /**
   * 画单个像素
   *
   * @param context
   * @param x
   * @param y
   * @param color
   */
  drawPixel = (x: number, y: number, color: number[], pixelSize: number = 1) => {
    const [r, g, b, a] = color;

    this.context.save();

    this.context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a ?? 1})`;
    this.context.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);

    this.context.restore();
  };

  setBackground = (color: string = '#000000') => {
    this.context.save();

    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);

    this.context.restore();
  };

  clear = () => {
    this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
  };

  /**
   * 画整个图像
   * Draw entire bitmap to screen
   */
  drawImage(image: ImageData) {
    this.context.putImageData(image, 0, 0);
  }

  /**
   * 绘制bitmap到画布中
   *
   * @param bitmap
   */
  drawImageFromBitmap(bitmap: Bitmap, pixelSize: number = 1) {
    const imageData = bitmap.toImageData(pixelSize);
    this.drawImage(imageData);
  }
}
