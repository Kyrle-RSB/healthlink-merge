// ============================================================
// Zoom Types — shared interfaces for Zoom integration
// ============================================================

export interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface ZoomCreateMeetingRequest {
  topic: string;
  type: 2;
  start_time: string;
  duration: number;
  timezone: string;
  password?: string;
  settings: {
    join_before_host: boolean;
    waiting_room: boolean;
    auto_recording: 'none' | 'local' | 'cloud';
    meeting_authentication: boolean;
  };
}

export interface ZoomUpdateMeetingRequest {
  topic?: string;
  start_time?: string;
  duration?: number;
  timezone?: string;
}

export interface ZoomMeetingResponse {
  id: number;
  uuid: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  join_url: string;
  start_url: string;
  password: string;
  status: string;
}

export interface ZoomErrorResponse {
  code: number;
  message: string;
}

export interface ZoomProviderConfig {
  accountId: string;
  clientId: string;
  clientSecret: string;
  sdkKey?: string;
  sdkSecret?: string;
  sdkAccessToken?: string;
  sdkRefreshToken?: string;
  sdkTokenExpiresAt?: number;
}
