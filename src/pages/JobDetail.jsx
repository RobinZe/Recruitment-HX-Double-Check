import React, { useState, useEffect } from 'react';
import { Typography, Button, Upload, List, Input, Card } from 'antd';
import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import jobsData from '../data/jobs.json';
import { Spin, Modal } from 'antd';

const { Title, Paragraph } = Typography;

// 职位详情页组件：展示职位信息并处理简历上传
const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [fileList, setFileList] = useState([]);
  const [jobDetail, setJobDetail] = useState({});
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState('');

  // 自动关闭弹窗的副作用
  useEffect(() => {
    let timer;
    if (modalVisible) {
      timer = setTimeout(() => {
        setModalVisible(false);
      }, 1000);
    }
    return () => timer && clearTimeout(timer);
  }, [modalVisible]);

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
      if (jobDetail?.title) formData.append('jobTitle', jobDetail.title);
      formData.append('file', file);

      // 设置请求超时控制 - 1分钟超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        onError(new Error('网络连接失败'));
        setUploading(false);
        setModalContent('网络超时，请连接外网重试');
        setModalVisible(true);
      }, 60000);

      // 从环境变量获取API基础URL，如果不存在则使用当前域名
      const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
      // 检查环境变量中的URL是否已经包含了'/api/upload'路径
      const apiUrl = baseUrl.includes('/api/upload') ? baseUrl : new URL('/api/upload', baseUrl).toString();
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      // 根据状态码处理响应
      if (response.status === 200) {
        const result = await response.json();
        onSuccess(result, file);
        setModalContent('上传成功');
        setModalVisible(true);
      } else {
        onError(new Error(`请求失败，状态码: ${response.status}`));
        setModalContent('上传失败');
        setModalVisible(true);
      }
      setUploading(false);
    } catch (error) {
      setUploading(false);
      if (error.name === 'AbortError') {
        setModalContent('网络超时，请连接外网重试');
      } else {
        setModalContent('上传失败');
      }
      setModalVisible(true);
      onError(error);
    }
  };

  // 处理文件上传状态变化
  const handleUpload = (info) => {
    // 更新文件列表
    setFileList(info.fileList);
    if (info.file.status === 'uploading') setUploading(true);
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

      <Modal
        visible={modalVisible}
        footer={null}
        closable={false}
        centered
        maskClosable={false}
        width={300}
        bodyStyle={{ padding: '20px', textAlign: 'center' }}
      >
        {modalContent}
      </Modal>

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
                showUploadList={{ showRemoveIcon: true }}
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
