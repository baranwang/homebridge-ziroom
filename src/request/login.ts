import { webkit } from 'playwright';

interface LoginResponse {
  error_code: number;
  error_msg: string;
  data: {
    token: string;
  };
}

export const login = async (account: string, password: string) => {
  const browser = await webkit.launch({ headless: false });
  const page = await browser.newPage();
  let responseData: LoginResponse | null = null;
  await page.route('**/index.php?r=account%2Flogin%2Flogin', async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    responseData = json;
    await route.continue();
  });
  await page.goto('https://passport.ziroom.com/login.html');
  await page.waitForSelector('input#user_name');
  await page.fill('input#user_name', account);
  await page.fill('input#user_pas', password);
  await page.click('#J-m-isSeven');
  await page.click('#loginConfirmHook');
  await page.click('#login_button');
  await page.waitForResponse('**/index.php?r=account%2Flogin%2Flogin');
  await browser.close();
  const { error_code, error_msg, data } = (responseData as LoginResponse | null) || {};
  if (error_code === 0) {
    return data?.token;
  }
  throw new Error(error_msg);
};
