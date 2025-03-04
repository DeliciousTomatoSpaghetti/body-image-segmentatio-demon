/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/videoTest/toDataURL.worker.js":
/*!*******************************************!*\
  !*** ./src/videoTest/toDataURL.worker.js ***!
  \*******************************************/
/***/ (() => {

eval("self.onmessage = function (e) {\r\n  const { frameData, segmentationResult } = e.data;\r\n\r\n  let ifHasBody = false;\r\n  // 应用分割蒙版\r\n  for (let i = 0; i < segmentationResult.length; i++) {\r\n    if (segmentationResult[i] === 0) { // 背景像素\r\n      frameData.data[i * 4 + 3] = 255; // 设置完全透明\r\n    } else { // 人物像素\r\n      ifHasBody = true;\r\n      frameData.data[i * 4] = 0;     // R 设置为 0\r\n      frameData.data[i * 4 + 1] = 0; // G 设置为 0\r\n      frameData.data[i * 4 + 2] = 0; // B 设置为 0\r\n      frameData.data[i * 4 + 3] = 0; // 保持不透明\r\n    }\r\n  }\r\n\r\n  if (!ifHasBody) {\r\n    self.postMessage(null);\r\n    return;\r\n  }\r\n  // 将 ImageData 转换为 Base64\r\n  imageDataToBase64(frameData).then((base64) => {\r\n    // 将 Base64 返回给主线程\r\n    self.postMessage(base64);\r\n  });\r\n}\r\n\r\nfunction imageDataToBase64(imageData) {\r\n  // 创建一个临时 canvas\r\n  const canvas = new OffscreenCanvas(imageData.width, imageData.height);\r\n  const ctx = canvas.getContext(\"2d\");\r\n\r\n  // 将 ImageData 绘制到 canvas\r\n  ctx.putImageData(imageData, 0, 0);\r\n\r\n  // 将 canvas 转换为 Base64\r\n  return canvas.convertToBlob().then((blob) => {\r\n    return new Promise((resolve) => {\r\n      const reader = new FileReader();\r\n      reader.onload = () => resolve(reader.result);\r\n      reader.readAsDataURL(blob);\r\n    });\r\n  });\r\n}\n\n//# sourceURL=webpack://bodyimagesegmentation/./src/videoTest/toDataURL.worker.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/videoTest/toDataURL.worker.js"]();
/******/ 	
/******/ })()
;