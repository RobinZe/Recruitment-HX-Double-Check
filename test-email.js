import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 测试邮件发送功能
async function testEmailSending() {
  console.log('开始测试邮件发送功能...');
  
  // 检查环境变量
  console.log('环境变量检查:', {
    MAIL_USERNAME: !!process.env.MAIL_USERNAME,
    MAIL_PASSWORD: !!process.env.MAIL_PASSWORD,
    TARGET_EMAIL: !!process.env.TARGET_EMAIL,
    NODE_ENV: process.env.NODE_ENV
  });
  
  if (!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD || !process.env.TARGET_EMAIL) {
    console.error('错误: 环境变量未正确配置');
    return;
  }
  
  // 创建邮件发送器
  const transporter = nodemailer.createTransport({
    host: 'smtp.163.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    },
    debug: true,
    logger: true
  });
  
  // 验证邮件发送器配置
  try {
    console.log('验证邮件发送器配置...');
    const verifyResult = await transporter.verify();
    console.log('验证结果:', verifyResult);
  } catch (error) {
    console.error('验证失败:', {
      message: error.message,
      code: error.code,
      command: error.command,
      name: error.name
    });
    // 继续尝试发送邮件
  }
  
  // 邮件选项
  const mailOptions = {
    from: process.env.MAIL_USERNAME,
    to: process.env.TARGET_EMAIL,
    subject: '测试邮件 - 排查Vercel部署问题',
    text: '这是一封测试邮件，用于排查Vercel部署环境中的邮件发送问题。',
    html: '<p>这是一封测试邮件，用于排查Vercel部署环境中的邮件发送问题。</p>'
  };
  
  // 发送邮件
  try {
    console.log('开始发送测试邮件...');
    const info = await transporter.sendMail(mailOptions);
    console.log('邮件发送成功:', {
      messageId: info.messageId,
      response: info.response
    });
  } catch (error) {
    console.error('邮件发送失败:', {
      message: error.message,
      code: error.code,
      command: error.command,
      name: error.name,
      responseCode: error.responseCode,
      rejected: error.rejected,
      response: error.response
    });
    
    // 针对特定错误类型提供更详细的日志
    if (error.code === 'EAUTH') {
      console.error('认证失败: 请检查邮箱账号和密码是否正确');
    } else if (error.code === 'ESOCKET') {
      console.error('网络连接问题: 可能是网络限制');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('连接超时: 邮件服务器响应超时');
    }
  }
}

// 执行测试
testEmailSending().catch(console.error);