import api from "./client";
import type { User } from "../types/user";

export async function login(username: string, password: string): Promise<User> {
  const { data } = await api.post<User>("/auth/login/", { username, password });
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout/");
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me/");
  return data;
}
