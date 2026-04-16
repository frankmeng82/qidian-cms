import { Card, Col, Row, Statistic } from 'antd';

export function DashboardPage() {
  return (
    <Row gutter={16}>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="视频总数" value={0} />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="分类数量" value={0} />
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card>
          <Statistic title="今日播放" value={0} />
        </Card>
      </Col>
    </Row>
  );
}
