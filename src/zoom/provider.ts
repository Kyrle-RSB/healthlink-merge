// ============================================================
// Zoom Meeting Provider — high-level meeting operations
// ============================================================

import type { ZoomApiClient } from './client';

export interface CreateMeetingParams {
  topic: string;
  startTime: string;
  durationMinutes: number;
  timezone: string;
  password?: string;
  joinBeforeHost?: boolean;
  waitingRoom?: boolean;
}

export interface MeetingResult {
  externalMeetingId: string;
  joinUrl: string;
  hostUrl: string;
  password: string | null;
  providerData: Record<string, unknown>;
}

export class ZoomMeetingProvider {
  constructor(private client: ZoomApiClient) {}

  async createMeeting(params: CreateMeetingParams): Promise<MeetingResult> {
    const meeting = await this.client.createMeeting({
      topic: params.topic,
      type: 2,
      start_time: params.startTime,
      duration: params.durationMinutes,
      timezone: params.timezone,
      password: params.password,
      settings: {
        join_before_host: params.joinBeforeHost ?? true,
        waiting_room: params.waitingRoom ?? false,
        auto_recording: 'none',
        meeting_authentication: false,
      },
    });

    return {
      externalMeetingId: String(meeting.id),
      joinUrl: meeting.join_url,
      hostUrl: meeting.start_url,
      password: meeting.password || null,
      providerData: {
        uuid: meeting.uuid,
        type: meeting.type,
        status: meeting.status,
        created_at: meeting.created_at,
      },
    };
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    await this.client.deleteMeeting(meetingId);
  }
}
