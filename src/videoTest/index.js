import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs-backend-webgl';

import ToDataURLWorker from "./toDataURL.worker.js";

const toDataURLWorker = new ToDataURLWorker()

const mask = document.querySelector('.mask');
mask.style.backgroundImage = `url(../public/football-player.png)`;
const videoElement = document.getElementById('video');

const WIDTH = 400
const HEIGHT = 600

// 创建离屏canvas处理视频帧
// const offscreenCanvas = document.createElement('canvas');
const offscreenCanvas = new OffscreenCanvas(WIDTH, HEIGHT);

const offscreenContext = offscreenCanvas.getContext('2d');

let lastTime = 0;
const targetFPS = 15;
let intervalTime = 1000 / targetFPS; // 每帧的时间间隔（毫秒）

// 处理视频分割
async function processVideoSegmentation() {

  // 加载BodyPix模型
  const segmentationModel = await bodyPix.load();


  // 帧处理函数
  async function processFrame() {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    if (deltaTime < intervalTime) {
      requestAnimationFrame(processFrame);
      return
    }
    lastTime = currentTime
    try {
      // 绘制当前视频帧到离屏canvas
      offscreenContext.drawImage(
        videoElement,
        0, 0,
        WIDTH,
        HEIGHT
      );

      // 执行人物分割
      const segmentationResult = await segmentationModel.segmentPerson(offscreenCanvas, {
        segmentationThreshold: 0.7,
        internalResolution: 'high',
        maxDetections: 1
      });
      // 获取像素数据
      const frameData = offscreenContext.getImageData(
        0, 0,
        WIDTH,
        HEIGHT
      );

      toDataURLWorker.postMessage({
        frameData: frameData,
        segmentationResult: segmentationResult.data,
      }, [frameData.data.buffer, segmentationResult.data.buffer])
      toDataURLWorker.onmessage = function (e) {
        const base64 = e.data
        if (!base64) {
          // debugger
          intervalTime = 2000
          mask.style.webkitMaskBoxImage = 'none';
          return
        }else {
          intervalTime = 1000 / targetFPS; // 每帧的时间间隔（毫秒）
          mask.style.webkitMaskBoxImage = `url(${base64})`;
        }
      }

      requestAnimationFrame(processFrame);
    } catch (frameError) {
      console.error('Frame processing error:', frameError);
    }
  }
  // 启动帧处理循环
  processFrame();
}
// 启动程序
async function main() {
  processVideoSegmentation();
}

// 启动主程序
main().catch((error) => {
  console.error('Application startup failed:', error);
});