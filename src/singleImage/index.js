import * as bodyPix from '@tensorflow-models/body-pix';
import '@tensorflow/tfjs-backend-webgl';

const imageElement = document.getElementById('image');
const canvasElement = document.getElementById('canvas');
const canvasContext = canvasElement.getContext('2d');

async function processImage() {
  // 设置画布尺寸与图片一致
  canvasElement.width = imageElement.width;
  canvasElement.height = imageElement.height;

  // 创建临时画布用于处理图像
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageElement.width;
  tempCanvas.height = imageElement.height;
  const tempContext = tempCanvas.getContext('2d', { willReadFrequently: true });

  // 将图片绘制到临时画布
  tempContext.drawImage(imageElement, 0, 0, imageElement.width, imageElement.height);

  // 加载 BodyPix 模型
  const bodyPixModel = await bodyPix.load();

  // 对图片进行人物分割
  const segmentation = await bodyPixModel.segmentPerson(tempCanvas, {
    segmentationThreshold: 0.4, // 分割阈值
    internalResolution: 'high', // 高分辨率
    maxDetections: 1, // 最多检测一个人
  });

  // 获取临时画布的像素数据
  const imageData = tempContext.getImageData(0, 0, imageElement.width, imageElement.height);

  // 根据分割结果修改背景透明度
  for (let i = 0; i < segmentation.data.length; i++) {
    if (segmentation.data[i] === 0) { // 背景区域
      imageData.data[i * 4 + 3] = 0; // 设置透明度为 0（完全透明）
    }
  }

  // 将处理后的图像绘制到主画布
  canvasContext.putImageData(imageData, 0, 0);
}

processImage();
