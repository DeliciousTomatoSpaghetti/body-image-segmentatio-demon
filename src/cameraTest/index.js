import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs-backend-webgl';

const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasContext = canvasElement.getContext('2d');

// 创建离屏canvas处理视频帧
const offscreenCanvas = document.createElement('canvas');
const offscreenContext = offscreenCanvas.getContext('2d', { willReadFrequently: true });

// 初始化视频流
async function initializeVideoStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = resolve;
    });
    return true;
  } catch (error) {
    console.error('Error accessing camera:', error);
    return false;
  }
}

// 处理视频分割
async function processVideoSegmentation() {
  try {
    // 设置画布尺寸与视频一致
    console.log(videoElement.videoWidth, videoElement.videoHeight);

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    offscreenCanvas.width = videoElement.videoWidth;
    offscreenCanvas.height = videoElement.videoHeight;

    // 加载BodyPix模型
    const segmentationModel = await bodyPix.load();

    // 帧处理函数
    async function processFrame() {
      try {
        // 绘制当前视频帧到离屏canvas
        offscreenContext.drawImage(
          videoElement,
          0, 0,
          videoElement.videoWidth,
          videoElement.videoHeight
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
          videoElement.videoWidth,
          videoElement.videoHeight
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
        requestAnimationFrame(processFrame);
      } catch (frameError) {
        console.error('Frame processing error:', frameError);
      }
    }

    // 启动帧处理循环
    processFrame();
  } catch (modelError) {
    console.error('Model initialization failed:', modelError);
  }
}

// 启动程序
async function main() {
  const streamInitialized = await initializeVideoStream();
  if (streamInitialized) {
    processVideoSegmentation();
  }
}

// 启动主程序
main().catch((error) => {
  console.error('Application startup failed:', error);
});