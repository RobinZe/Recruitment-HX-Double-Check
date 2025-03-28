# 邮件发送问题解决方案

经过分析，您在Vercel部署环境中遇到的邮件发送问题可能有以下几个原因：

## 1. Vercel环境限制

Vercel的无服务器函数环境对SMTP连接有严格限制：

- **执行时间限制**：Vercel函数默认执行时间上限为10秒，而SMTP连接和邮件发送可能需要更长时间
- **网络限制**：某些Vercel部署区域可能限制了对SMTP服务器的出站连接
- **端口限制**：Vercel可能限制了465端口的使用，这是163邮箱SSL连接的默认端口

## 2. 163邮箱SMTP服务限制

163邮箱对第三方应用的SMTP访问有严格的安全策略：

- **IP限制**：163可能会限制来自未知IP或云服务提供商IP的SMTP连接
- **频率限制**：对短时间内的连接请求有频率限制
- **安全检查**：对异常登录行为有额外的安全检查

## 3. 环境变量配置问题

检查您的Vercel项目中是否正确配置了以下环境变量：

- `MAIL_USERNAME`: 您的163邮箱地址
- `MAIL_PASSWORD`: 您的163邮箱授权码（不是登录密码）
- `TARGET_EMAIL`: 接收简历的目标邮箱地址

## 解决方案

### 方案一：使用第三方邮件服务API

最推荐的解决方案是使用专为云函数/无服务器环境设计的邮件服务API：

1. **SendGrid**：
   - 注册SendGrid账号并获取API密钥
   - 安装SendGrid包：`npm install @sendgrid/mail`
   - 修改代码使用SendGrid API发送邮件

   ```javascript
   // 示例代码
   import sgMail from '@sendgrid/mail';
   
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   
   const msg = {
     to: process.env.TARGET_EMAIL,
     from: 'your-verified-sender@example.com', // 必须是已验证的发件人
     subject: `新简历投递: ${jobTitle}`,
     text: `收到新的简历投递，职位: ${jobTitle}，文件名: ${fileName}`,
     attachments: [
       {
         content: fileBuffer.toString('base64'),
         filename: fileName,
         type: 'application/pdf',
         disposition: 'attachment'
       }
     ]
   };
   
   await sgMail.send(msg);
   ```

2. **Mailgun**：
   - 注册Mailgun账号并获取API密钥
   - 安装Mailgun包：`npm install mailgun-js`
   - 修改代码使用Mailgun API发送邮件

### 方案二：尝试不同的SMTP配置

如果您仍希望使用163邮箱，可以尝试以下配置：

1. 使用587端口（STARTTLS）代替465端口（SSL）：

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});
```

2. 增加超时设置：

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 15000, // 15秒连接超时
  greetingTimeout: 15000,   // 15秒问候超时
  socketTimeout: 30000      // 30秒套接字超时
});
```

### 方案三：使用Outlook或Gmail邮箱

某些邮箱服务提供商对第三方应用的支持更好：

```javascript
// Outlook
const transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
    user: process.env.OUTLOOK_EMAIL,
    pass: process.env.OUTLOOK_PASSWORD
  }
});

// Gmail (需要开启"不够安全的应用访问"或使用应用专用密码)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD
  }
});
```

## 调试步骤

1. **查看Vercel日志**：
   - 在Vercel控制台中查看函数执行日志
   - 特别关注与邮件发送相关的错误信息

2. **本地测试**：
   - 使用`node test-email.js`在本地测试邮件发送
   - 比较本地环境和Vercel环境的差异

3. **增加详细日志**：
   - 在代码中添加更详细的日志记录
   - 记录每个步骤的执行情况和可能的错误

## 结论

在Vercel等无服务器环境中，使用专门的邮件服务API（如SendGrid、Mailgun）是最可靠的解决方案，它们专为云环境设计，能够绕过SMTP连接的各种限制。如果您必须使用SMTP，建议尝试Outlook或Gmail等对第三方应用支持更好的邮箱服务。