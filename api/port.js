// 在Vercel环境中，我们不需要动态端口，直接返回API路径
export default function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 返回API路径而不是端口
  res.status(200).json({ port: 'api' });
}