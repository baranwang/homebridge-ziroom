import crypto from 'crypto';
import fetch from 'node-fetch';
import { URL } from 'url';
import { v4 as uuidv4 } from 'uuid';

const secret_key = 'vpRZ1kmU';
const iv = 'EbpU4WtY';

export function encodeDes(plainText: string) {
  const cipher = crypto.createCipheriv('des-cbc', secret_key, iv);
  cipher.setAutoPadding(true);
  let encryptedText = cipher.update(plainText, 'utf8', 'hex');
  encryptedText += cipher.final('hex');
  return encryptedText;
}

export function decodeDes(encryptedText: string) {
  const decipher = crypto.createDecipheriv('des-cbc', secret_key, iv);
  decipher.setAutoPadding(true);
  let plainText = decipher.update(encryptedText, 'hex', 'utf8');
  plainText += decipher.final('utf8');
  return plainText;
}

const baseURL = 'https://ztoread.ziroom.com/';

export function request<T>(url: string, body: any, token: string) {
  const timestamp = Date.now();
  return fetch(new URL(url, baseURL), {
    method: 'POST',
    headers: {
      appType: '10',
      'User-Agent': 'ZJProject/1.2.2 (iPhone; iOS 15.4; Scale/3.00)',
      Sys: 'app',
      'Client-Version': '1.2.2',
      'Request-Id': `${uuidv4().substring(0, 8).toUpperCase()}:${(
        timestamp / 1000
      ).toFixed(0)}`,
      timestamp: `${timestamp}`,
      'Content-Type': 'application/json',
      'Client-Type': 'ios',
      phoneName: 'iPhone',
      osVersion: '15.4',
      osType: 'iOS',
      token,
    },
    body: encodeDes(JSON.stringify(body)),
  })
    .then((res) => res.text())
    .then((text) => JSON.parse(decodeDes(text)) as Ziroom.APIResponse<T>);
}

export const API_URL = {
  getHomeList: 'homeapi/v10/home/queryHomeList',
  getDeviceList: 'homeapi/ziroom/index/v3/queryIndex',
  getDevBaseInfo: 'homeapi/v2/device/queryDevBaseInfo',
  getDeviceDetail: 'homeapi/v3/device/deviceDetailPage',
  setDeviceByOperCode: 'homeapi/v2/device/controlDeviceByOperCode',
};
