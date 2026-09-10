import crypto from 'crypto';
import { config } from '../config/index.js';

interface OAuthStateData {
  verifier: string;
  expiresAt: number;
  returnUrl?: string;
}

export interface KuUserProfile {
  uid: string;
  fullname: string;
  email: string;
  raw: Record<string, any>;
}

export class KuAllLoginService {
  // In-memory PKCE state storage with TTL (15 minutes)
  private static states = new Map<string, OAuthStateData>();

  private static cleanupExpiredStates(): void {
    const now = Date.now();
    for (const [key, value] of KuAllLoginService.states.entries()) {
      if (value.expiresAt <= now) {
        KuAllLoginService.states.delete(key);
      }
    }
  }

  /**
   * สร้าง Code Verifier ตามมาตรฐาน RFC 7636
   */
  private static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const bytes = crypto.randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  /**
   * คำนวณ S256 Code Challenge
   */
  private static generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  /**
   * สร้าง Authorize URL พร้อม PKCE Parameter
   */
  static getAuthorizeUrl(returnUrl?: string): string {
    KuAllLoginService.cleanupExpiredStates();

    const state = crypto.randomBytes(32).toString('hex');
    const verifier = KuAllLoginService.generateRandomString(96);
    const challenge = KuAllLoginService.generateCodeChallenge(verifier);

    KuAllLoginService.states.set(state, {
      verifier,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 นาที
      returnUrl,
    });

    const queryParams = new URLSearchParams({
      response_type: 'code',
      client_id: config.kuAllLogin.clientId,
      redirect_uri: config.kuAllLogin.redirectUri,
      scope: config.kuAllLogin.scope,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    return `${config.kuAllLogin.authorizeUrl}?${queryParams.toString()}`;
  }

  /**
   * ตรวจสอบ State และดึง Verifier
   */
  static consumeState(state: string): OAuthStateData {
    KuAllLoginService.cleanupExpiredStates();

    const data = KuAllLoginService.states.get(state);
    if (!data) {
      throw new Error('Invalid or expired OAuth state.');
    }

    KuAllLoginService.states.delete(state);
    return data;
  }

  /**
   * แลก Authorization Code กับ Access Token ผ่าน KU All-login Token Endpoint
   */
  static async exchangeCodeForToken(code: string, verifier: string): Promise<string> {
    const postBody: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.kuAllLogin.redirectUri,
      client_id: config.kuAllLogin.clientId,
      code_verifier: verifier,
    };

    if (config.kuAllLogin.clientSecret) {
      postBody.client_secret = config.kuAllLogin.clientSecret;
    }

    const response = await fetch(config.kuAllLogin.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams(postBody).toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`KU All-login token exchange failed (${response.status}): ${errText}`);
    }

    const tokenData = (await response.json()) as any;
    if (!tokenData.access_token) {
      throw new Error('KU All-login did not return an access token.');
    }

    return tokenData.access_token;
  }

  /**
   * ดึงข้อมูลโปรไฟล์ผู้ใช้จาก KU All-login UserInfo Endpoint
   */
  static async getUserProfile(accessToken: string): Promise<KuUserProfile> {
    const response = await fetch(config.kuAllLogin.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to fetch user profile from KU All-login (${response.status}): ${errText}`);
    }

    const profile = (await response.json()) as any;
    const uid = (profile.userid || profile.uid || profile.sub || '').trim();

    if (!uid) {
      throw new Error('User ID (uid/userid/sub) is missing from KU All-login profile.');
    }

    let fullname = '';
    if (profile.thainame) {
      const pre = (profile.thaiprename || '').trim();
      const first = (profile.thainame || '').trim();
      const last = (profile.surname || '').trim();
      fullname = `${pre} ${first} ${last}`.trim();
    } else {
      fullname = (profile.fullname || profile.name || uid).trim();
    }

    const email = (
      profile.email ||
      profile['google-mail'] ||
      profile['office365-mail'] ||
      `${uid}@ku.th`
    ).trim();

    return {
      uid,
      fullname,
      email,
      raw: profile,
    };
  }
}
