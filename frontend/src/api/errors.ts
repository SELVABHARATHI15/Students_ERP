import axios from "axios";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData: unknown = error.response?.data;
    if (isRecord(responseData) && typeof responseData.detail === "string") {
      return responseData.detail;
    }
    if (typeof responseData === "string") return responseData;
    if (responseData !== undefined) return JSON.stringify(responseData);
    return error.message;
  }
  return error instanceof Error ? error.message : "Request failed.";
}
