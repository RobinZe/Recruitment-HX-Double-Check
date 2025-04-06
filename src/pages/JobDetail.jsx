import React, { useState, useEffect } from 'react';
import { Typography, Button, Upload, message, List, Input, Card } from 'antd';
import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import jobsData from '../data/jobs.json';
import { Spin, Modal } from 'antd';

const { Title, Paragraph } = Typography;

// 职位详情页组件：展示职位信息并处理简历上传
const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 状态管理
  const [fileList, setFileList] = useState([]); // 上传文件列表
  const [jobDetail, setJobDetail] = useState({}); // 职位详情信息
  const [uploading, setUploading] = useState(false); // 上传状态

  // 获取并设置职位详情信息
  useEffect(() => {
    const job = jobsData.jobs.find(job => job.id === id);
    if (job) {
      setJobDetail({
        title: job.title,
        location: job.location,
        description: typeof job.description === 'string' ? job.description.split('\n') : job.description,
        requirements: job.requirements
      });
    }
  }, [id]);

  // 自定义文件上传处理
  const customRequest = async ({ file, onSuccess, onError, onProgress }) => {
    try {
      const formData = new FormData();
      if (jobDetail && jobDetail.title) {
        formData.append('jobTitle', jobDetail.title);
      }
      formData.append('file', file);

      // 设置请求超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25秒超时，比服务器稍长

      // 使用绝对路径确保API请求正确发送
      // 从环境变量获取API基础URL，如果不存在则使用当前域名
      const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
      // 确保URL格式正确，避免重复域名
      const apiUrl = new URL('/api/upload', baseUrl).toString();
      console.log('发送请求到:', apiUrl, '环境变量:', import.meta.env.VITE_API_BASE_URL);
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (result.success) {
        onSuccess(result, file);
        setUploading(false);
        message.success(
          result.emailSent 
            ? '简历上传成功，邮件已发送' 
            : '简历已保存至临时目录'
        );
      } else if (result.timeout) {
        onError(new Error('请求超时'));
        setUploading(false);
        message.error('请求超时，请稍后重试');
      } else {
        onError(new Error(result.message || '上传失败'));
        setUploading(false);
        if (result.emailError) {
          message.warning(`文件已保存（${result.filename || '未知文件名'}），但邮件发送失败`);
        } else {
          message.error(result.message || '上传失败');
        }
      }
    } catch (error) {
      onError(error);
      setUploading(false);
      if (error.name === 'AbortError') {
        message.error('请求超时，请稍后重试');
      } else {
        message.error('上传过程中发生错误');
      }
    }
  };

  // 处理文件上传状态变化
  const handleUpload = (info) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/')}
        style={{ marginBottom: 24 }}
      >
        返回
      </Button>
      
      <Card bordered={false}>
        <Typography>
          <Title level={2} style={{ marginBottom: 16 }}>{jobDetail.title}</Title>
          <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
            <strong>📍 工作地点：</strong>{jobDetail.location}
          </Paragraph>
          
          <div style={{ marginBottom: 32 }}>
            <Title level={4} style={{ marginBottom: 16 }}>岗位描述</Title>
            <List
              size="small"
              bordered
              dataSource={jobDetail.description}
              renderItem={item => <List.Item>{item}</List.Item>}
              style={{ 
                marginBottom: 24, 
                textAlign: 'left',
                display: 'block',
                whiteSpace: 'pre-line'
              }}
            />

            <Title level={4} style={{ marginBottom: 16 }}>岗位要求</Title>
            <List
              size="small"
              bordered
              dataSource={jobDetail.requirements}
              renderItem={item => <List.Item>{item}</List.Item>}
              style={{ 
                marginBottom: 24, 
                textAlign: 'left',
                display: 'block',
                whiteSpace: 'pre-line'
              }}
            />
          </div>

          <div style={{ marginTop: 32 }}>
            <Spin spinning={uploading} tip="正在上传...">
              <Upload
                maxCount={1}
                accept=".pdf"
                fileList={fileList}
                onChange={handleUpload}
                customRequest={customRequest}
                disabled={uploading}
              >
                <Button 
                  type="primary" 
                  icon={<UploadOutlined />} 
                  size="large"
                  style={{ width: '100%' }}
                >
                  提交简历（PDF格式）
                </Button>
              </Upload>
            </Spin>
          </div>
        </Typography>
      </Card>
    </div>
  );
};

export default JobDetail;