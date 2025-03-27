import React from 'react';
import { List, Typography, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import jobsData from '../data/jobs.json';

const { Title, Paragraph } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const jobs = jobsData.jobs;

  return (
    <div style={{ padding: '24px' }}>
      <Typography>
        <Title level={2}>欢迎来到BGI招聘</Title>
        <Paragraph>
          BGI致力于用基因科技造福人类，我们期待优秀的你加入我们的团队，
          一起推动科技创新，实现生命科学的突破。
        </Paragraph>
      </Typography>

      <Title level={3}>最新岗位</Title>
      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={jobs}
        renderItem={(job) => (
          <List.Item>
            <div 
              onClick={() => navigate(`/job/${job.id}`)}
              style={{ 
                padding: '16px',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                width: '100%',
                cursor: 'pointer',
                backgroundColor: '#f0f8ff'
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: 500 }}>{job.title}</div>
              <div style={{ marginTop: 8, whiteSpace: 'nowrap' }}>工作地点：{job.location}</div>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};

export default Home;