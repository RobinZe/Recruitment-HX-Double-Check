import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Divider, Alert } from 'antd';

const { Title, Paragraph, Text } = Typography;

const Debug = () => {
  const [apiInfo, setApiInfo] = useState({
    baseUrl: '',
    fullApiUrl: '',
    envVars: {}
  });
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 收集环境信息
    const envVars = {};
    for (const key in import.meta.env) {
      if (key.startsWith('VITE_')) {
        envVars[key] = import.meta.env[key];
      }
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    const fullApiUrl = baseUrl + '/api/upload';

    setApiInfo({
      baseUrl,
      fullApiUrl,
      envVars
    });
  }, []);

  const testApiConnection = async () => {
    setLoading(true);
    try {
      // 发送OPTIONS请求测试API连接
      const response = await fetch(apiInfo.fullApiUrl, {
        method: 'OPTIONS',
      });
      
      setTestResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers])
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card title="API调试页面" bordered={false}>
        <Title level={3}>环境信息</Title>
        <Paragraph>
          <Text strong>当前URL:</Text> {window.location.href}
        </Paragraph>
        <Paragraph>
          <Text strong>API基础URL:</Text> {apiInfo.baseUrl}
        </Paragraph>
        <Paragraph>
          <Text strong>完整API URL:</Text> {apiInfo.fullApiUrl}
        </Paragraph>

        <Divider />
        
        <Title level={3}>环境变量</Title>
        {Object.keys(apiInfo.envVars).length > 0 ? (
          Object.entries(apiInfo.envVars).map(([key, value]) => (
            <Paragraph key={key}>
              <Text strong>{key}:</Text> {value}
            </Paragraph>
          ))
        ) : (
          <Paragraph>未找到VITE_开头的环境变量</Paragraph>
        )}

        <Divider />
        
        <Button 
          type="primary" 
          onClick={testApiConnection} 
          loading={loading}
        >
          测试API连接
        </Button>

        {testResult && (
          <div style={{ marginTop: '16px' }}>
            <Alert
              type={testResult.success ? 'success' : 'error'}
              message={testResult.success ? 'API连接成功' : 'API连接失败'}
              description={
                <div>
                  {testResult.success ? (
                    <>
                      <Paragraph>状态码: {testResult.status} ({testResult.statusText})</Paragraph>
                      <Paragraph>响应头:</Paragraph>
                      <pre>{JSON.stringify(testResult.headers, null, 2)}</pre>
                    </>
                  ) : (
                    <Paragraph>错误信息: {testResult.error}</Paragraph>
                  )}
                </div>
              }
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default Debug;