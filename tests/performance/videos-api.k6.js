import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    videos_list: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000', 'avg<500'],
  },
};

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3000';

export default function () {
  const listRes = http.get(`${BASE_URL}/api/v1/videos?page=1&pageSize=20`);
  check(listRes, {
    'videos list status 200': (r) => r.status === 200,
  });

  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
  });

  sleep(1);
}
