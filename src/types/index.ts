export interface CapturedRequest {
  id: string;
  endpointId: string;
  method: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string | null;
  ip: string | null;
  createdAt: string | Date;
}

export interface EndpointData {
  id: string;
  createdAt: string | Date;
  lastActive: string | Date;
}
