self.onmessage = function (e) {
  const data = e.data;
  // 对接收到的数据进行处理
  const result = data * 2;
  // 将处理结果发送回主线程
  self.postMessage(result);
}