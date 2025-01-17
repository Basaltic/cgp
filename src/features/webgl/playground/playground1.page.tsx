import { useMount } from 'ahooks';
import React, { useRef } from 'react';
import { createShader, createProgram } from '../webglutil';

// 相当于是以右上角为 （0，0）的2d 画布
const vertexShaderSource = `
  // an attribute will receive data from a buffer
  attribute vec2 a_position;

  // 传入的分辨率
  uniform vec2 u_resolution;

  // all shaders have a main function
  void main() {
    // pixel position to [0, 1]
    vec2 zeroToOne = a_position / u_resolution;

    vec2 zeroToTwo = zeroToOne * 2.0;

    vec2 clipSpace = zeroToTwo - 1.0;


    // gl_Position is a special variable a vertex shader
    // is responsible for setting
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

const fragmentShaderSource = `
  // fragment shaders don't have a default precision so we need
  // to pick one. mediump is a good default
  precision mediump float;

  uniform vec4 u_color;

  void main() {
    // gl_FragColor is a special variable a fragment shader
    // is responsible for setting
    gl_FragColor = u_color; // return reddish-purple
  }
`;

/**
 * WebGL 随便尝试、玩耍的地方
 */
export function WebglPlaygroundPage1() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useMount(() => {
    if (canvasRef.current) {
      const gl = canvasRef.current.getContext('webgl');
      if (gl) {
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        const program = createProgram(gl, vertexShader, fragmentShader);
        if (program) {
          // 初始化的时候获取 shader中定义的attribute
          const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
          const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
          const colorUniformLocation = gl.getUniformLocation(program, 'u_color');

          // 创建buffer，attribute需要从buffer中获取数据
          const positionBuffer = gl.createBuffer() as WebGLBuffer;

          // 绑定buffer
          // 把positionBuffer绑定到 gl.ARRAY_BUFFER这个全局变量
          gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

          // 通过 gl.ARRAY_BUFFER 这个标识，自动把positions的数据放到buffer中
          const positions = [10, 20, 80, 20, 10, 30, 10, 30, 80, 20, 80, 30];
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

          // 把 [-1, 1] 的标准立方体坐标映射到画布大小的像素坐标
          // [-1,  1 ]-> [0, canvas.width] & [0, canvas.height]
          gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

          // 清除颜色，透明
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);

          // 告诉gl使用这个程序
          gl.useProgram(program);

          // 表示这个attribute是可用的
          gl.enableVertexAttribArray(positionAttributeLocation);

          // 告诉webgl的 这个attribute如何从 buffer中获取数据。绘制顶点
          const size = 2; // 每次取几个值
          const type = gl.FLOAT; // 取得数据的数据类型
          const normalize = false; // 是否需要归一
          const stride = 0; // 取数据的时候间隔是多少。比如size是2，stride是1，那么取顺序[0,1] -> [3,4]
          let offset = 0; // 从多少偏移位置开始去buffer中的数据
          gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

          // 把值传给shader的uniform
          gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

          // 真正的绘制像素
          // count是3，表示执行vertex shader三次
          // 因为类型是 TRIANGLES， 三角形，每执行三次就会绘制一个三角形
          const primitiveType = gl.TRIANGLES;
          offset = 0;
          const count = 6;
          gl.drawArrays(primitiveType, offset, count);

          for (let i = 0; i < 50; i++) {
            setRectangle(gl, randomInt(300), randomInt(300), randomInt(300), randomInt(300));

            // 设置随机的颜色
            gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

            // 画
            gl.drawArrays(gl.TRIANGLES, 0, 6);
          }
        }
      }
    }
  });

  return (
    <div style={{ background: 'white', width: 'fit-content', margin: '10px 0px 0px 10px' }}>
      <canvas ref={canvasRef} width="800" height="800" />
    </div>
  );
}

/**
 * 画真长方形
 * @param gl
 * @param x
 * @param y
 * @param width
 * @param height
 */
function setRectangle(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) {
  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]), gl.STATIC_DRAW);
}

function randomInt(range: number) {
  return Math.floor(Math.random() * range);
}
