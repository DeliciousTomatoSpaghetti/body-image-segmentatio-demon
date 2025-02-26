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
    segmentationThreshold: 0.4,
    internalResolution: 'high',
    maxDetections: 1
  });

  // 获取临时画布的像素数据
  const imageData = tempContext.getImageData(0, 0, imageElement.width, imageElement.height);

  // 创建新的黑白图像数据
  const binaryImageData = new ImageData(imageElement.width, imageElement.height);
  
  for (let i = 0; i < segmentation.data.length; i++) {
    const isForeground = segmentation.data[i] !== 0; // 前景（人物）判断
    
    // 设置每个像素的RGBA值
    const baseIndex = i * 4;
    binaryImageData.data[baseIndex] = isForeground ? 255 : 0;     // R
    binaryImageData.data[baseIndex + 1] = isForeground ? 255 : 0; // G
    binaryImageData.data[baseIndex + 2] = isForeground ? 255 : 0; // B
    binaryImageData.data[baseIndex + 3] = 255;                    // Alpha（完全不透明）
  }
  console.log(binaryImageData);
  
  // 将黑白图像绘制到主画布
  canvasContext.putImageData(binaryImageData, 0, 0);
}

processImage().catch(console.error);