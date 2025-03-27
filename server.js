import express from 'express';
import cors from 'cors';
import multer from 'multer';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ dest: 'uploads/' });

// 跨域配置
app.use(cors());
app.use(express.json());

// 邮件传输配置
const transporter = nodemailer.createTransport({
  service: 'Outlook365',
  auth: {
    user: process.env.OUTLOOK_EMAIL,
    pass: process.env.OUTLOOK_PASSWORD
  }
});

// 文件上传路由
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const mailOptions = {
      from: process.env.OUTLOOK_EMAIL,
      to: process.env.TARGET_EMAIL,
      subject: `新简历投递 - ${req.body.jobTitle}`,
      text: `收到${req.body.jobTitle}岗位的新简历，请查收附件。`, 
      attachments: [{
        filename: req.file.originalname,
        path: req.file.path
      }]
    };

    await transporter.sendMail(mailOptions);
    
    res.json({ 
      success: true,
      emailSent: true,
      filename: req.file.originalname 
    });
  } catch (error) {
    console.error('邮件发送失败:', error);
    res.status(500).json({ 
      success: false,
      emailError: true,
      message: '文件已保存但邮件发送失败'
    });
  }
});

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('NODE_ENV:', process.env.NODE_ENV);
});