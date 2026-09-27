const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('request', request => {
    if(request.url().includes('token')) console.log('REQ:', request.method(), request.url());
  });
  page.on('response', response => {
    if(response.url().includes('token')) console.log('RES:', response.status(), response.url());
  });

  await page.goto('https://documind-frontend-three.vercel.app/');
  
  await page.type('input[type="text"]', 'utkarsh_admin');
  await page.type('input[type="password"]', 'backend_auth_2026');
  
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForResponse(r => r.url().includes('token'), {timeout: 5000}).catch(()=>console.log('Timeout waiting for response'))
  ]);
  
  await browser.close();
})();
