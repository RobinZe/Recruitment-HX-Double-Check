import express from 'express';
import multer from 'multer';
import path from 'path';
import url from 'url';
import { createRequire } from 'module';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
const require = createRequire(import.meta.url);

// 加载环境变量
dotenv.config();

const app = express();
// 删除此处的port声明，因为在文件末尾已经有一个port声明

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 在Vercel环境中，静态文件由Vercel自动处理
if (process.env.VERCEL) {
  app.use(express.static('dist'));
} else {
  app.use(express.static(path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), 'dist')));
}
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 在Vercel环境中使用内存存储
const storage = process.env.VERCEL ? multer.memoryStorage() : multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const jobTitle = decodeURIComponent(req.body.jobTitle).replace(/[\/\\:*?"<>|]/g, '');
    // 使用 YYYY-MM-DD 格式的日期
    const date = new Date();
    const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeFilename = `${jobTitle}_${formattedDate}_${originalName}`;
    cb(null, safeFilename);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('仅允许PDF格式'))
});

// 创建上传目录
const fs = require('fs');
const uploadsDir = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}



// 配置邮件发送器
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.163.com', // 163 SMTP服务器
    port: 465, // 使用SSL的端口
    secure: true, // 对于465端口，设置为true
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    },
    tls: {
      ciphers: 'SSLv3', // 使用更安全的加密方式
      rejectUnauthorized: true // 在开发环境中可以设置为false，生产环境建议设置为true
    }
  });
};

// 发送邮件函数
const sendEmail = async (filePath, fileName, jobTitle) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.MAIL_USERNAME,
      to: process.env.TARGET_EMAIL,
      subject: `新简历投递: ${jobTitle}`,
      text: `收到新的简历投递，职位: ${jobTitle}，文件名: ${fileName}`,
      attachments: [
        {
          filename: fileName,
          path: filePath
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('邮件发送失败:', error);
    return { success: false, error: error.message };
  }
};

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('接收到的请求体：', req.body);
    console.log('文件保存成功：', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      destination: req.file.destination,
      path: req.file.path,
      size: req.file.size
    });
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未接收到文件'
      });
    }

    // 确保文件已保存到uploads目录
    const savedFilePath = path.resolve(uploadsDir, req.file.filename);
    console.log('实际保存路径：', savedFilePath);
    if (!fs.existsSync(savedFilePath)) {
      console.error('文件保存验证失败', {
        expectedPath: savedFilePath,
        receivedFile: req.file
      });
      return res.status(500).json({
        success: false,
        message: '文件保存失败'
      });
    }
    
    // 设置邮件发送超时
    const emailTimeout = setTimeout(() => {
      return res.status(408).json({
        success: false,
        message: '请求超时',
        timeout: true
      });
    }, 20000); // 20秒超时
    
    // 发送邮件
    const jobTitle = req.body.jobTitle || '未指定职位';
    const emailResult = await sendEmail(savedFilePath, req.file.filename, jobTitle);
    
    // 清除超时定时器
    clearTimeout(emailTimeout);
    
    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: '文件上传成功，邮件已发送',
        filename: req.file.filename,
        emailSent: true
      });
    } else {
      res.status(500).json({
        success: false,
        message: '文件已上传，但邮件发送失败',
        filename: req.file.filename,
        emailError: emailResult.error
      });
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({ 
      message: error.message || '服务器错误',
      errorDetails: {
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

app.get('/port', (req, res) => {
  res.json({ port: actualPort });
});

app.get('/', (req, res) => {
  res.sendFile(path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), 'dist', 'index.html'));
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`服务器运行在端口 ${port}`);
});