import type { Logger } from 'homebridge';
import { createCipheriv, createDecipheriv, randomUUID } from 'node:crypto';
import { URL } from 'node:url';
import type { ZiroomDeviceInfo } from '../types';
import { login } from './login';

export interface ZiroomRequestOptions {
  token?: string;
  account?: string;
  password?: string;
  hid?: string;
}

export class ZiroomRequest {
  private static readonly SECRET_KEY = 'vpRZ1kmU';
  private static readonly IV = 'EbpU4WtY';

  private hid = '';

  private token = '';
  private tokenExpiredAt = Number.POSITIVE_INFINITY;

  constructor(
    public readonly log: Logger,
    private readonly options: ZiroomRequestOptions,
  ) {
    this.hid = options.hid ?? '';
    this.token = options.token ?? '';
  }

  private encodeDes(plainText: string): string {
    const cipher = createCipheriv('des-cbc', ZiroomRequest.SECRET_KEY, ZiroomRequest.IV);
    cipher.setAutoPadding(true);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decodeDes(encrypted: string): string {
    const decipher = createDecipheriv('des-cbc', ZiroomRequest.SECRET_KEY, ZiroomRequest.IV);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private async getToken() {
    if (this.token && this.tokenExpiredAt > Date.now()) {
      return this.token;
    }
    await this.login();
    return this.token;
  }

  private async login() {
    if (this.options.account && this.options.password) {
      const token = await login(this.options.account, this.options.password);
      if (token) {
        this.token = token;
        this.tokenExpiredAt = Date.now() + 1000 * 60 * 60 * 24 * 3;
      }
    }
  }

  private async createHeaders(timestamp: number) {
    const token = await this.getToken();
    const headers = new Headers({
      token,
      'User-Agent': 'ZiroomerProject/7.14.7 (iPhone; iOS 18.5; Scale/3.00)',
      'Content-Type': 'application/json',
      appType: '1',
      sys: 'app',
      timestamp: timestamp.toString(),
      'Request-Id': `${randomUUID().slice(0, 8)}:${Math.floor(timestamp / 1000)}`,
      'Client-Type': 'ios',
      phoneName: 'iPhone',
      osType: 'iOS',
      osVersion: '18.5',
    });

    return headers;
  }

  private getJwtPayload() {
    const [, payload] = this.token.split('.');
    try {
      const payloadString = Buffer.from(payload, 'base64').toString('utf8');
      return JSON.parse(payloadString);
    } catch (error) {
      this.log.error(String(error));
      return null;
    }
  }

  get uid() {
    return this.getJwtPayload()?.uid;
  }

  async getHid() {
    if (this.hid) {
      return this.hid;
    }
    const resp = await this.request<{ hid: string }[]>('/homeapi/v10/home/queryHomeList', {
      uid: this.uid,
    });
    this.hid = resp?.[0]?.hid ?? '';
    return this.hid;
  }

  public async request<T = any>(path: string, data: Record<string, any>): Promise<T> {
    const timestamp = Date.now();
    const body = this.encodeDes(JSON.stringify(data));
    const url = new URL(path, 'https://ztoread.ziroom.com/');
    const headers = await this.createHeaders(timestamp);

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      if (!resp.ok) {
        const error = new Error(`请求失败: ${resp.status} ${resp.statusText}`);
        this.log.error(error.message);
        throw error;
      }

      const text = await resp.text();
      const dataString = this.decodeDes(text);

      const respData = JSON.parse(dataString);
      if (respData.code === '200') {
        return respData.data as T;
      }
      if (respData.code === '40005') {
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            await this.login();
            return this.request(path, data);
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              this.log.error(`登录重试${maxRetries}次失败`);
              throw error;
            }
            this.log.warn(`登录失败，正在进行第${retryCount}次重试`);
          }
        }
      }
      throw new Error(`[${path}] ${respData.code}: ${respData.message}`);
    } catch (error) {
      if (error instanceof SyntaxError) {
        const err = new Error(`响应解析失败: ${error.message}`);
        this.log.error(err.message);
        throw err;
      }
      this.log.error(String(error));
      throw error;
    }
  }

  public async getDeviceList() {
    const hid = await this.getHid();
    const resp = await this.request('/homeapi/v4/homePageDevice/queryAreaDeviceListNew', {
      uid: this.uid,
      hid,
      type: 0,
      version: 25,
    });
    const devices = new Map<string, ZiroomDeviceInfo>();
    for (const category of resp.deviceData.deviceList) {
      for (const device of category.deviceList) {
        devices.set(device.devUuid, device);
      }
    }
    return Array.from(devices.values());
  }

  public async getDeviceDetail(devUuid: string) {
    const hid = await this.getHid();
    const resp = await this.request<ZiroomDeviceInfo>('/homeapi/v3/device/deviceDetailPage', {
      uid: this.uid,
      hid,
      version: 19,
      devUuid,
    });
    return resp;
  }

  public async setDeviceState(devUuid: string, prodOperCode: string, param: string) {
    const hid = await this.getHid();
    const resp = await this.request('/homeapi/v2/device/controlDeviceByOperCode', {
      uid: this.uid,
      hid,
      devUuid,
      prodOperCode,
      param,
    });
    return resp;
  }
}
