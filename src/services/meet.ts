import { getAccessToken } from './firebase';

export interface MeetingSpaceResult {
  name: string;
  meetingUri: string;
  meetingCode: string;
  createdAt: string;
}

/**
 * Creates a real Google Meet space using the Google Meet REST API v2
 * Scope: https://www.googleapis.com/auth/meetings.space.created
 */
export async function createGoogleMeetingSpace(): Promise<MeetingSpaceResult> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  const response = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Meet API error:', response.status, errorText);

    if (response.status === 401 || response.status === 403) {
      throw new Error('TOKEN_EXPIRED_OR_FORBIDDEN');
    }
    throw new Error(`Google Meet uchrashuvi yaratishda xatolik: ${response.status}`);
  }

  const data = await response.json();
  return {
    name: data.name || '',
    meetingUri: data.meetingUri || `https://meet.google.com/${data.meetingCode || 'new'}`,
    meetingCode: data.meetingCode || data.meetingUri?.split('/').pop() || '',
    createdAt: new Date().toISOString(),
  };
}
