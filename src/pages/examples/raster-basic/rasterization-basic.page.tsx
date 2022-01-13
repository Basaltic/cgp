import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '../../../renderer/canvas';
import { DEG_TO_RAD } from '../../../libs/math/const';
import { Triangle } from '../../../libs/shapes/triangle';
import { Vector3 } from '../../../libs/math/vector3';
import { useHotkeys } from 'react-hotkeys-hook';
import { FormItem } from '../../../component/form';
import { Matrix4 } from '../../../libs/math/matrix4';

const WIDTH = 800;
const HEIGHT = 800;

const DEFAULT_COLOR = [255, 255, 255];

/**
 * 基本光栅化
 * @returns
 */
export default function BasicRasterizationPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [options, setOptions] = useState<any>({
    x_rotate_angle: 0,
    y_rotate_angle: 0,
    z_rotate_angle: 0,
    anti_alias: 0,
    pixel_size: 8,
    eye_fov: 45,
    z_near: -1,
    z_far: -50,
    objects: objectsArray[0]
  });

  // 旋转快捷键
  useHotkeys('A', () => setOptions({ ...options, y_rotate_angle: options.y_rotate_angle - 10 }), [options]);
  useHotkeys('d', () => setOptions({ ...options, y_rotate_angle: options.y_rotate_angle + 10 }), [options]);
  useHotkeys('w', () => setOptions({ ...options, x_rotate_angle: options.x_rotate_angle - 10 }), [options]);
  useHotkeys('s', () => setOptions({ ...options, x_rotate_angle: options.x_rotate_angle + 10 }), [options]);
  useHotkeys('q', () => setOptions({ ...options, z_rotate_angle: options.z_rotate_angle - 10 }), [options]);
  useHotkeys('e', () => setOptions({ ...options, z_rotate_angle: options.z_rotate_angle + 10 }), [options]);

  useEffect(() => {
    startRender();
  }, [options.z_rotate_angle, options.y_rotate_angle, options.x_rotate_angle]);

  /**
   * 开始绘制
   */
  const startRender = () => {
    if (!canvasRef.current) return;

    const context: CanvasRenderingContext2D = canvasRef.current.getContext('2d') as CanvasRenderingContext2D;
    const canvas = new Canvas(context);
    canvas.clear();

    const width = WIDTH / options.pixel_size;
    const height = HEIGHT / options.pixel_size;

    // 空间中点坐标定义
    const vecs = options.objects.vecs;
    // 组成三角形关系
    const inds = options.objects.inds;
    // 每个点的颜色
    const cols = options.objects.cols;

    const eye_fov = options.eye_fov;
    const eye_pos = new Vector3(0, 0, 5);
    const z_near = options.z_near;
    const z_far = options.z_far;
    const aspect_ratio = 1;

    const view = get_view_matrix(eye_pos);
    const model = get_model_matrix(options.z_rotate_angle, options.y_rotate_angle, options.x_rotate_angle);
    const projection = get_projection_matrix(eye_fov, aspect_ratio, z_near, z_far);

    const mvp = projection.multiply(view).multiply(model);

    const f1 = (Math.abs(z_far) - Math.abs(z_near)) / 2;
    const f2 = (Math.abs(z_far) + Math.abs(z_near)) / 2;

    const frame_buffer: number[][] = [];
    const z_buffer: number[][] = [];

    for (let m = 0; m < inds.length; m++) {
      const ind = inds[m];

      // 新建一个三角形
      const colors = [cols[m], cols[m], cols[m]].map((c) => Vector3.fromArray(c));
      const v0 = Vector3.fromArray(vecs[ind[0]]);
      const v1 = Vector3.fromArray(vecs[ind[1]]);
      const v2 = Vector3.fromArray(vecs[ind[2]]);
      const triangle = new Triangle([v0, v1, v2], colors);

      // mvp 变换
      triangle.transformMVP(mvp);
      // viewport 变换
      triangle.transfromViewport(width, height, f1, f2);

      // 看锯齿选项 MSAA - n * n
      const is_open_anti_alias = options.anti_alias > 0;
      const anti_alias_n = options.anti_alias;

      // 渲染
      triangle.render(frame_buffer, z_buffer, width, height, is_open_anti_alias, anti_alias_n);
    }

    // 画出整个frame
    for (let i = 0; i < frame_buffer.length; i++) {
      const color = frame_buffer[i];
      const x = i % width;
      const y = Math.floor(i / width);

      // 有颜色
      let needDraw = !!color;

      if (needDraw) {
        canvas.drawPixel(x, y, color, options.pixel_size);
      }
    }

    console.log(vecs);
    console.log('render finished !');
  };

  /**
   * 抗锯齿选项
   */
  const change_anti_alias_option = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const n = parseInt(e.target.value);
    setOptions({ ...options, anti_alias: n });
  };

  /**
   * 更改像素的大小
   */
  const change_pixel_size = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = parseInt(e.target.value);
    setOptions({ ...options, pixel_size: size });
  };

  /**
   * 更改z near
   */
  const change_z_near = (e: React.ChangeEvent<HTMLInputElement>) => {
    const z_near = parseInt(e.target.value);
    setOptions({ ...options, z_near });
  };

  /**
   * 更改z far
   */
  const change_z_far = (e: React.ChangeEvent<HTMLInputElement>) => {
    const z_far = parseInt(e.target.value);
    setOptions({ ...options, z_far });
  };

  /**
   * 更改 eye fov
   */
  const change_eye_fov = (e: React.ChangeEvent<HTMLInputElement>) => {
    const eye_fov = parseInt(e.target.value);
    setOptions({ ...options, eye_fov });
  };

  /**
   *
   * @param type
   */
  const change_scene = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    switch (type) {
      case '1':
        setOptions({
          ...options,
          objects: objectsArray[0]
        });
        break;
      case '2':
        setOptions({
          ...options,
          objects: objectsArray[1]
        });
        break;
    }
  };

  return (
    <div style={{ background: 'white', width: 'fit-content', margin: '10px 0px 0px 10px' }}>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />

      <div style={{ position: 'absolute', top: 10, left: 1000 }}>
        <div>
          <form>
            <FormItem label="Z Near">
              <input type="number" value={options.z_near} onChange={change_z_near} />
            </FormItem>
            <FormItem label="Z Far">
              <input type="number" value={options.z_far} onChange={change_z_far} />
            </FormItem>
            <FormItem label="Eye fov">
              <input type="number" value={options.eye_fov} onChange={change_eye_fov} />
            </FormItem>
            <FormItem label="Pixel Size">
              <select value={`${options.pixel_size}`} onChange={change_pixel_size}>
                <option value="1">1x</option>
                <option value="4">4x</option>
                <option value="8">8x</option>
              </select>
            </FormItem>
            <FormItem label="Anti Alias">
              <select onChange={change_anti_alias_option}>
                <option value="0">--Please choose an option--</option>
                <option value="2">MSAA 4x</option>
                <option value="4">MSAA 8x</option>
                <option value="8">MSAA 16x</option>
              </select>
            </FormItem>
            <FormItem label="Scene">
              <select onChange={change_scene}>
                <option value="1">三角形</option>
                <option value="2">三角锥</option>
                {/* <option value="3">MSAA 16x</option> */}
              </select>
            </FormItem>
          </form>
        </div>
        <br />
        <br />
        <div>
          <button onClick={startRender}>Render</button>
        </div>
        <br />
        <br />
        <div>x 轴旋转：W, S</div>
        <div>y 轴旋转：A, D</div>
        <div>z 轴旋转：Q, E</div>
      </div>
    </div>
  );
}

/**
 * 获取模型矩阵 - 也就是变换矩阵
 */
const get_model_matrix = (z_rotation_angle: number, y_rotation_angle: number, x_rotation_angle: number) => {
  const z_rad_angle = z_rotation_angle * DEG_TO_RAD;
  const z_cos_value = Math.cos(z_rad_angle);
  const z_sin_value = Math.sin(z_rad_angle);
  const rotateByZMatrix = Matrix4.createBy2dArray([
    [z_cos_value, -z_sin_value, 0, 0],
    [z_sin_value, z_cos_value, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ]);

  const y_rad_angle = y_rotation_angle * DEG_TO_RAD;
  const y_cos_value = Math.cos(y_rad_angle);
  const y_sin_value = Math.sin(y_rad_angle);
  const rotateByYMatrix = Matrix4.createBy2dArray([
    [y_cos_value, 0, y_sin_value, 0],
    [0, 1, 0, 0],
    [-y_sin_value, 0, y_cos_value, 0],
    [0, 0, 0, 1]
  ]);

  const x_rad_angle = x_rotation_angle * DEG_TO_RAD;
  const x_cos_value = Math.cos(x_rad_angle);
  const x_sin_value = Math.sin(x_rad_angle);
  const rotateByXMatrix = Matrix4.createBy2dArray([
    [1, 0, 0, 0],
    [0, x_cos_value, -x_sin_value, 0],
    [0, x_sin_value, x_cos_value, 0],
    [0, 0, 0, 1]
  ]);

  console.log(x_rotation_angle, y_rotation_angle, z_rotation_angle);

  return rotateByXMatrix.multiply(rotateByYMatrix).multiply(rotateByZMatrix);
};

/**
 * 根据摄像机（观察）所在的位置，生成一个平移矩阵，移动到（0，0，0）的位置
 * @param eyePos
 */
const get_view_matrix = (eyePos: Vector3) => {
  const viewTranslateMatrix = Matrix4.createBy2dArray([
    [1, 0, 0, -eyePos.x],
    [0, 1, 0, -eyePos.y],
    [0, 0, 1, -eyePos.z],
    [0, 0, 0, 1]
  ]);
  return viewTranslateMatrix;
};

/**
 * 获取投影矩阵
 *
 * @param eye_fov 摄像机的视野角度
 * @param aspect_ratio 宽长比
 * @param zNear 近平面距离（）
 * @param zFar 远平面距离
 */
const get_projection_matrix = (eye_fov: number, aspect_ratio: number, zNear: number, zFar: number) => {
  const radian_fov = eye_fov * DEG_TO_RAD;
  const tan_fov = Math.tan(radian_fov / 2);

  const top = tan_fov * Math.abs(zNear);
  const right = aspect_ratio * top;

  const right_to_left = right * 2;
  const top_to_bottom = top * 2;
  const near_to_far = zNear - zFar;

  // 这里默认 摄像机 在z轴上，那么不需要 x & y 轴的平移了
  // 正交矩阵
  const o1 = Matrix4.createBy2dArray([
    [2 / right_to_left, 0, 0, 0],
    [0, 2 / top_to_bottom, 0, 0],
    [0, 0, 2 / near_to_far, 0],
    [0, 0, 0, 1]
  ]);
  const o2 = Matrix4.createBy2dArray([
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, -(zNear + zFar) / 2],
    [0, 0, 0, 1]
  ]);
  const ortho = o1.multiply(o2);

  // 透视转为正交的矩阵
  const persp_to_ortho = Matrix4.createBy2dArray([
    [zNear, 0, 0, 0],
    [0, zNear, 0, 0],
    [0, 0, zNear + zFar, -zNear * zFar],
    [0, 0, 1, 0]
  ]);

  const proj = ortho.multiply(persp_to_ortho);
  return proj;
};

const objectsArray: any[] = [
  {
    vecs: [
      [2, 0, -2],
      [0, 2, -2],
      [-2, 0, -2],
      [3.5, -1, -5],
      [2.5, 1.5, -5],
      [-1, 0.5, -5],
      [1, 0, -1],
      [0, 4, -4],
      [-2, 0, -7]
    ],
    inds: [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8]
    ],
    cols: [
      [185, 217, 238],
      [217, 238, 185],
      [66, 135, 245]
    ]
  },
  {
    vecs: [
      [2, 0, -2],
      [0, 2, -2],
      [-2, 0, -2],
      [0, 0, -6]
    ],
    inds: [
      [0, 1, 2],
      [0, 1, 3],
      [1, 2, 3],
      [0, 2, 3]
    ],

    cols: [
      [185, 217, 238],
      [217, 238, 185],
      [66, 135, 245],
      [50, 168, 82]
    ]
  }
];
