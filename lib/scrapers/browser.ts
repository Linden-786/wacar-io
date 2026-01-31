import puppeteer, { Browser, Page } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

let browserInstance: Browser | null = null

export async function getBrowser(): Promise<Browser> {
  if (browserInstance) {
    return browserInstance
  }

  // For local development, use local Chrome
  const isLocal = process.env.NODE_ENV === 'development' || !process.env.AWS_LAMBDA_FUNCTION_NAME

  if (isLocal) {
    // Try common Chrome paths for local development
    const executablePath = process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : '/usr/bin/google-chrome'

    browserInstance = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })
  } else {
    // For Vercel/serverless, use @sparticuz/chromium
    browserInstance = await puppeteer.launch({
      executablePath: await chromium.executablePath(),
      headless: true,
      args: chromium.args,
    })
  }

  return browserInstance
}

export async function getPage(): Promise<Page> {
  const browser = await getBrowser()
  const page = await browser.newPage()

  // Set a realistic user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  )

  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 })

  // Block unnecessary resources to speed up loading
  await page.setRequestInterception(true)
  page.on('request', (req) => {
    const resourceType = req.resourceType()
    // Allow images since we need them, block other heavy resources
    if (['font', 'media'].includes(resourceType)) {
      req.abort()
    } else {
      req.continue()
    }
  })

  return page
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}
