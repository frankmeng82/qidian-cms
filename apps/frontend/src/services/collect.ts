import { http } from './http';

export async function fetchCollectRules() {
  const { data } = await http.get('/collect/rules');
  return data as Array<{
    id: string;
    name: string;
    sourceUrl: string;
    sourceType: string;
    cronExpr: string | null;
    maxItems: number;
    minIntervalMs: number;
    status: number;
  }>;
}

export async function createCollectRule(payload: {
  name: string;
  sourceUrl: string;
  sourceType: 'xml' | 'json';
  cronExpr?: string;
  maxItems?: number;
  minIntervalMs?: number;
}) {
  const { data } = await http.post('/collect/rules', payload);
  return data;
}

export async function executeCollectRule(payload: { ruleId: string; limit?: number }) {
  const { data } = await http.post('/collect/execute', payload);
  return data as { taskId: string; status: string; message: string };
}

export async function fetchCollectLogs() {
  const { data } = await http.get('/collect/logs');
  return data as Array<{
    id: string;
    status: string;
    triggerType: string;
    message: string | null;
    total: number;
    created: number;
    skipped: number;
    failed: number;
    createdAt: string;
    rule: { id: string; name: string };
  }>;
}
