"""
test_full_report.py
===================
Comprehensive Selenium test: combines basic info, SEO, security
headers, mobile responsiveness checks, screenshots, and a
structured JSON report output.

Requirements:
    pip install selenium requests

Usage:
    python test_full_report.py https://example.com
    python test_full_report.py https://example.com --save-screenshot
"""

import sys
import json
import time
import base64
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def check_security_headers(url: str) -> dict:
    """Use requests to fetch HTTP response headers for security analysis."""
    try:
        resp = requests.head(url, timeout=10, allow_redirects=True,
                             headers={"User-Agent": "Mozilla/5.0"})
        headers = {k.lower(): v for k, v in resp.headers.items()}
        return {
            "status_code":          resp.status_code,
            "hsts":                 "strict-transport-security" in headers,
            "x_frame_options":      "x-frame-options" in headers,
            "x_content_type":       "x-content-type-options" in headers,
            "content_security_policy": "content-security-policy" in headers,
            "referrer_policy":      "referrer-policy" in headers,
        }
    except Exception as e:
        return {"error": str(e)}


def run_full_test(url: str, save_screenshot: bool = False) -> dict:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})

    driver = webdriver.Chrome(options=options)
    report = {"url": url, "engine": "Python Selenium WebDriver"}

    try:
        # ── 1. Performance ──────────────────────────────────────────
        start = time.time()
        driver.get(url)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        report["load_time_ms"] = round((time.time() - start) * 1000)
        report["final_url"]    = driver.current_url
        report["page_title"]   = driver.title

        # ── 2. SEO ──────────────────────────────────────────────────
        def get_meta(name):
            els = driver.find_elements(
                By.CSS_SELECTOR, f'meta[name="{name}"], meta[property="{name}"]'
            )
            return els[0].get_attribute("content") if els else None

        h1_els = driver.find_elements(By.TAG_NAME, "h1")
        imgs_no_alt = driver.execute_script(
            "return document.querySelectorAll('img:not([alt]), img[alt=\"\"]').length;"
        )
        report["seo"] = {
            "title":            driver.title or "Missing",
            "meta_description": get_meta("description") or "Missing",
            "meta_keywords":    get_meta("keywords") or "Missing",
            "og_title":         get_meta("og:title") or "Missing",
            "h1_count":         len(h1_els),
            "first_h1":         h1_els[0].text.strip() if h1_els else "Not found",
            "images_missing_alt": imgs_no_alt,
        }

        # ── 3. DOM Structure ────────────────────────────────────────
        report["dom"] = {
            "links":   len(driver.find_elements(By.TAG_NAME, "a")),
            "images":  len(driver.find_elements(By.TAG_NAME, "img")),
            "forms":   len(driver.find_elements(By.TAG_NAME, "form")),
            "inputs":  len(driver.find_elements(By.TAG_NAME, "input")),
            "buttons": len(driver.find_elements(By.TAG_NAME, "button")),
            "iframes": len(driver.find_elements(By.TAG_NAME, "iframe")),
        }

        # ── 4. Mobile Responsiveness ────────────────────────────────
        driver.set_window_size(375, 812)
        time.sleep(1)
        has_vp_meta = bool(driver.find_elements(
            By.CSS_SELECTOR, 'meta[name="viewport"]'
        ))
        scroll_w = driver.execute_script("return document.documentElement.scrollWidth;")
        inner_w  = driver.execute_script("return window.innerWidth;")
        report["responsiveness"] = {
            "has_viewport_meta":     has_vp_meta,
            "no_horizontal_scroll":  scroll_w <= inner_w,
        }
        driver.set_window_size(1280, 800)

        # ── 5. Security Headers (via requests) ──────────────────────
        report["security"] = check_security_headers(url)

        # ── 6. Cookies ──────────────────────────────────────────────
        cookies = driver.get_cookies()
        report["cookies"] = {
            "count": len(cookies),
            "names": [c["name"] for c in cookies],
        }

        # ── 7. JS Console Errors ────────────────────────────────────
        try:
            logs = driver.get_log("browser")
            js_errors = [l["message"] for l in logs if l["level"] == "SEVERE"]
        except Exception:
            js_errors = []
        report["js_errors"] = js_errors

        # ── 8. Desktop Screenshot (base64) ──────────────────────────
        screenshot_b64 = driver.get_screenshot_as_base64()
        if save_screenshot:
            filename = "screenshot_selenium.png"
            with open(filename, "wb") as f:
                f.write(base64.b64decode(screenshot_b64))
            report["screenshot_saved"] = filename
            print(f"[*] Screenshot saved to {filename}")
        else:
            report["screenshot_base64"] = screenshot_b64[:60] + "... (truncated)"

        report["overall_status"] = "PASS"

    except Exception as e:
        report["overall_status"] = "FAIL"
        report["error"] = str(e)

    finally:
        driver.quit()

    return report


def print_report(report: dict):
    print("\n" + "=" * 60)
    print("  FULL SELENIUM REPORT")
    print("=" * 60)

    print(f"\n  URL          : {report.get('url')}")
    print(f"  Final URL    : {report.get('final_url', 'N/A')}")
    print(f"  Page Title   : {report.get('page_title', 'N/A')}")
    print(f"  Load Time    : {report.get('load_time_ms', 'N/A')} ms")
    print(f"  Status       : {report.get('overall_status', 'N/A')}")

    if report.get("seo"):
        print("\n  [SEO]")
        for k, v in report["seo"].items():
            print(f"    {k:<25}: {v}")

    if report.get("dom"):
        print("\n  [DOM Structure]")
        for k, v in report["dom"].items():
            print(f"    {k:<25}: {v}")

    if report.get("security"):
        print("\n  [Security Headers]")
        for k, v in report["security"].items():
            status = "✓" if v is True else ("✗" if v is False else str(v))
            print(f"    {k:<30}: {status}")

    if report.get("responsiveness"):
        print("\n  [Mobile Responsiveness]")
        for k, v in report["responsiveness"].items():
            print(f"    {k:<30}: {'✓' if v else '✗'}")

    if report.get("cookies"):
        print(f"\n  [Cookies]  count={report['cookies']['count']} | "
              f"names={report['cookies']['names']}")

    if report.get("js_errors"):
        print(f"\n  [JS Errors] ({len(report['js_errors'])} found)")
        for err in report["js_errors"]:
            print(f"    ✗ {err}")
    else:
        print("\n  [JS Errors]  None detected ✓")

    if report.get("error"):
        print(f"\n  [!] Fatal Error: {report['error']}")

    print("=" * 60)


if __name__ == "__main__":
    save_ss = "--save-screenshot" in sys.argv
    args    = [a for a in sys.argv[1:] if not a.startswith("--")]
    target_url = args[0] if args else "https://example.com"

    print(f"\n[*] Running full Selenium report on: {target_url}")
    report = run_full_test(target_url, save_screenshot=save_ss)
    print_report(report)

    # Also dump full JSON
    print("\n  [Full JSON Output]")
    print(json.dumps({k: v for k, v in report.items()
                      if k != "screenshot_base64"}, indent=2))
