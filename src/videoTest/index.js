import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs-backend-webgl';

import ToDataURLWorker from "./toDataURL.worker.js";

const toDataURLWorker = new ToDataURLWorker()

const mask = document.querySelector('.mask');
const canvas = document.querySelector('#canvas');
const videoElement = document.getElementById('video');
const img = document.querySelector('#img');

mask.style.backgroundImage = `url(../public/football-player.png)`;

const tempCanvasContext = canvas.getContext('2d');

let lastTime = 0;
const targetFPS = 15;
let intervalTime = 1000 / targetFPS; // 每帧的时间间隔（毫秒）

// 处理视频分割
async function processVideoSegmentation() {
  // 获取显示尺寸
  const WIDTH = mask.offsetWidth;
  const HEIGHT = mask.offsetHeight;

  const videoWidth = videoElement.videoWidth;
  const videoHeight = videoElement.videoHeight;

  const { renderedWidth, renderedHeight } = getVideoRenderedSize(videoElement);

  console.log('video', videoWidth, videoHeight)
  console.log('rendered', renderedWidth, renderedHeight);

  const offscreenCanvas = new OffscreenCanvas(WIDTH, WIDTH);

  const offscreenContext = offscreenCanvas.getContext('2d');

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
      // 修改绘制方式保持原始比例
      tempCanvasContext.drawImage(videoElement,
        0, 0,
        renderedWidth, renderedHeight,
        // 0, 0, WIDTH, HEIGHT
      );
      offscreenContext.drawImage(videoElement,
        (WIDTH - renderedWidth) / 2, 0, renderedWidth, renderedHeight,
        // 0, 0, WIDTH, HEIGHT
      );

      // 执行人物分割
      const segmentationResult = await segmentationModel.segmentPerson(offscreenCanvas, {
        segmentationThreshold: 0.7,
        internalResolution: 'high',
        maxDetections: 1
      });
      // 获取像素数据
      const frameData = offscreenContext.getImageData(
        0, 0, WIDTH, HEIGHT,
        // 0, 0, WIDTH, HEIGHT,
      );

      toDataURLWorker.postMessage({
        frameData: frameData,
        segmentationResult: segmentationResult.data,
        width: WIDTH,
        height: HEIGHT,
      }, [frameData.data.buffer, segmentationResult.data.buffer])
      toDataURLWorker.onmessage = function (e) {
        const base64 = e.data
        if (!base64) {
          // debugger
          intervalTime = 2000
          mask.style.webkitMaskBoxImage = 'none';
          return
        } else {
          intervalTime = 1000 / targetFPS; // 每帧的时间间隔（毫秒）
          mask.style.webkitMaskBoxImage = `url(${base64})`;
          // mask.style.maskSize = 'contain'
          // mask.style.webkitMaskSize = 'contain'
          img.src = base64
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
  await new Promise(resolve => {
    videoElement.addEventListener('loadedmetadata', resolve);
  });
  processVideoSegmentation();
}
// 启动主程序
main().catch((error) => {
  console.error('Application startup failed:', error);
});


function getVideoRenderedSize(videoElement) {
  const container = videoElement.parentElement;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  const videoRatio = videoElement.videoWidth / videoElement.videoHeight; // 视频原始宽高比
  const containerRatio = containerWidth / containerHeight; // 容器宽高比

  let renderedWidth, renderedHeight;

  if (containerRatio > videoRatio) {
    // 容器比视频宽，视频高度填满容器，宽度按比例缩放
    renderedHeight = containerHeight;
    renderedWidth = containerHeight * videoRatio;
  } else {
    // 容器比视频高，视频宽度填满容器，高度按比例缩放
    renderedWidth = containerWidth;
    renderedHeight = containerWidth / videoRatio;
  }

  return {
    renderedWidth,
    renderedHeight
  };
}