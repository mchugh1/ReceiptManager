export interface GoogleUser {
  id: number;
  email: string;
  name: string;
  profilePicture?: string;
}

export const googleAuth = {
  async getAuthUrl(): Promise<string> {
    const response = await fetch('/api/auth/google');
    const data = await response.json();
    return data.authUrl;
  },

  async handleCallback(code: string): Promise<GoogleUser> {
    const response = await fetch('/api/auth/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    return data.user;
  },

  async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      const response = await fetch('/api/auth/user');
      if (response.status === 401) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Failed to get user');
      }
      return await response.json();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });
  },
};
