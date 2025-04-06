# 招聘网页应用

v2.2.0

这是一个简单的招聘网页应用，允许用户浏览职位信息并上传简历。

## 功能特点

- 浏览职位列表
- 查看职位详情
- 上传简历（PDF格式）
- 自动发送简历到指定邮箱

## 安装与运行

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
创建一个 `.env` 文件在项目根目录，并添加以下配置：
```
OUTLOOK_EMAIL=your_email@outlook.com
OUTLOOK_PASSWORD=your_password
TARGET_EMAIL=recipient_email@example.com
```

3. 启动前端开发服务器：
```bash
npm run dev
```

4. 启动后端服务器：
```bash
node server.js
```

## 邮箱配置说明

本应用使用 Resend 邮件服务发送简历附件。您需要在 `.env` 文件中提供以下配置：

- `RESEND_API_KEY`: 您的 Resend API 密钥
- `TARGET_EMAIL`: 接收简历的目标邮箱地址

### 注意事项

1. Resend API 密钥获取方法：
   - 注册 [Resend](https://resend.com) 账号
   - 在控制台中创建 API 密钥
   - 复制 API 密钥到 `.env` 文件中

2. 如果您想使用其他邮件服务提供商（如 SendGrid、Mailgun 等），需要修改 `server.js` 和 `api/upload.js` 中的邮件发送代码。

3. 确保您的邮箱服务提供商允许通过 SMTP 发送邮件，某些免费邮箱可能会限制此功能。

4. 在Vercel部署环境中，可能会遇到邮件发送问题，详细排查步骤请参考 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)。

## 安全机制
1. 输入验证：
   - 文件类型白名单校验（pdf/docx）
   - 邮箱格式正则验证
2. 防御措施：
   - 限制请求体大小（100MB）
   - 文件名消毒防止路径遍历
3. 日志监控：
   - 记录上传操作和邮件发送状态
   - 错误预警机制

## 调试功能

1. 调试页面访问：
   - 在浏览器中访问 `/debug` 路径即可进入调试页面
2. 调试功能说明：
   - 查看当前系统状态信息
   - 测试API接口
   - 查看上传文件列表

## 数据库设计
```
应聘记录表
├── 应聘ID (主键)
├── 职位名称
├── 申请人邮箱
├── 简历存储路径
├── 投递时间
└── 处理状态（未读/已查看/已回复）
```
