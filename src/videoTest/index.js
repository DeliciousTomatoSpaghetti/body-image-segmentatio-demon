import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs-backend-webgl';

const container = document.querySelector('.container');
const mask = document.querySelector('.mask');
mask.style.backgroundImage = `url(../public/football-player.png)`;
const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasContext = canvasElement.getContext('2d');
const WIDTH = 400
const HEIGHT = 600

// 创建离屏canvas处理视频帧
const offscreenCanvas = document.createElement('canvas');
const offscreenContext = offscreenCanvas.getContext('2d', { willReadFrequently: true });


// 处理视频分割
async function processVideoSegmentation() {
  console.log(canvasElement, videoElement);
  // 设置画布尺寸与视频一致
  console.log(videoElement.videoWidth, videoElement.videoHeight);

  canvasElement.width = WIDTH
  canvasElement.height = HEIGHT
  offscreenCanvas.width = WIDTH
  offscreenCanvas.height = HEIGHT

  // 加载BodyPix模型
  const segmentationModel = await bodyPix.load();

  // 帧处理函数
  async function processFrame() {
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
        internalResolution: 'medium',
        maxDetections: 1
      });
      // 获取像素数据
      const frameData = offscreenContext.getImageData(
        0, 0,
        WIDTH,
        HEIGHT
      );

      // 应用分割蒙版
      for (let i = 0; i < segmentationResult.data.length; i++) {
        if (segmentationResult.data[i] === 0) { // 背景像素
          frameData.data[i * 4 + 3] = 255; // 设置完全透明
        } else { // 人物像素
          frameData.data[i * 4] = 0;     // R 设置为 0
          frameData.data[i * 4 + 1] = 0; // G 设置为 0
          frameData.data[i * 4 + 2] = 0; // B 设置为 0
          frameData.data[i * 4 + 3] = 0; // 保持不透明
        }
      }

      // 绘制到主canvas
      canvasContext.putImageData(frameData, 0, 0);
      const base64=canvasElement.toDataURL()
      // debugger
      // mask.style.backgroundImage = `url(${base64})`;
      mask.style.webkitMaskBoxImage=`url(${base64})`;
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