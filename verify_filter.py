import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://localhost:3000/blog")

        # Click filter button
        print("Clicking filter button...")
        await page.click('[data-testid="filter-toggle-button"]')

        # Wait for lazy panel
        print("Waiting for filter panel...")
        await page.wait_for_selector('[data-testid="filter-panel"]')

        # Take screenshot
        await page.screenshot(path="/home/jules/verification/blog_filter_lazy.png")
        print("Screenshot saved to /home/jules/verification/blog_filter_lazy.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
