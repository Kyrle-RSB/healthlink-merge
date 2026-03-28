// ============================================================
// Zoom API Client — Server-to-Server OAuth + meeting CRUD
// ============================================================

import type {
  ZoomProviderConfig,
  ZoomCreateMeetingRequest,
  ZoomMeetingResponse,
  ZoomUpdateMeetingRequest,
  ZoomErrorResponse,
  ZoomTokenResponse,
} from './types';

export class ZoomApiClient {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private config: ZoomProviderConfig) {}

  private async ensureToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && this.tokenExpiresAt > now + 60_000) {
      return this.accessToken;
    }

    const credentials = btoa(`${this.config.clientId}:${this.config.clientSecret}`);
    const params = new URLSearchParams({
      grant_type: 'account_credentials',
      account_id: this.config.accountId,
    });

    const res = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const error = (await res.json()) as ZoomErrorResponse;
      throw new Error(`Zoom OAuth error: ${error.message} (code ${error.code})`);
    }

    const data = (await res.json()) as ZoomTokenResponse;
    this.accessToken = data.access_token;
    this.tokenExpiresAt = now + data.expires_in * 1000;
    return this.accessToken;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const token = await this.ensureToken();
    const res = await fetch(`https://api.zoom.us/v2${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return undefined as T;

    if (!res.ok) {
      const error = (await res.json()) as ZoomErrorResponse;
      throw new Error(`Zoom API error (${res.status}): ${error.message}`);
    }

    return (await res.json()) as T;
  }

  async createMeeting(data: ZoomCreateMeetingRequest): Promise<ZoomMeetingResponse> {
    return this.request<ZoomMeetingResponse>('POST', '/users/me/meetings', data as never);
  }

  async updateMeeting(meetingId: string, data: ZoomUpdateMeetingRequest): Promise<void> {
    await this.request<void>('PATCH', `/meetings/${meetingId}`, data as never);
  }

  async getMeeting(meetingId: string): Promise<ZoomMeetingResponse> {
    return this.request<ZoomMeetingResponse>('GET', `/meetings/${meetingId}`);
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    await this.request<void>('DELETE', `/meetings/${meetingId}`);
  }
}
