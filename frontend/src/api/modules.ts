import api from "./client";

export async function fetchOrdsList(path: string): Promise<unknown> {
  const { data } = await api.get(path);
  return data;
}

export async function postOrds(path: string, body: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post(path, body);
  return data;
}

export async function putOrds(path: string, body: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.put(path, body);
  return data;
}

export async function deleteOrds(path: string): Promise<void> {
  await api.delete(path);
}

export async function fetchDashboardSummary(): Promise<unknown> {
  const { data } = await api.get("/dashboard/summary/");
  return data;
}
