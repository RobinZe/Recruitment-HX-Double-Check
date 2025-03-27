import multer from 'multer';
import { createRequire } from 'module';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { join } from 'path';
import { createReadStream } from 'fs';

// 加载环境变量
dotenv.config();

// 使用内存存储而不是磁盘存储
const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('仅允许PDF格式'))
});

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
const sendEmail = async (fileBuffer, fileName, jobTitle) => {
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
          content: fileBuffer
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

// 处理上传请求的中间件
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// API处理函数
export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '方法不允许' });
  }

  try {
    // 使用multer处理文件上传
    await runMiddleware(req, res, upload.single('file'));

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未接收到文件'
      });
    }

    console.log('接收到的请求体：', req.body);
    console.log('文件信息：', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // 生成文件名
    const jobTitle = req.body.jobTitle || '未指定职位';
    const date = new Date();
    const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
    const originalName = req.file.originalname;
    const safeFilename = `${jobTitle}_${formattedDate}_${originalName}`;

    // 发送邮件
    const emailResult = await sendEmail(req.file.buffer, safeFilename, jobTitle);
    
    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: '文件上传成功，邮件已发送',
        filename: safeFilename,
        emailSent: true
      });
    } else {
      res.status(500).json({
        success: false,
        message: '文件已上传，但邮件发送失败',
        filename: safeFilename,
        emailError: emailResult.error
      });
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || '服务器错误'
    });
  }
}

export const config = {
  api: {
    bodyParser: false, // 禁用内置的bodyParser，因为我们使用multer
  },
};