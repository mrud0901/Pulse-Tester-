"""
test_functional.py
==================
Functional Selenium test: checks forms, inputs, buttons,
broken links (sampled), cookies, and JS console errors.

Requirements:
    pip install selenium

Usage:
    python test_functional.py https://example.com
"""

import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import urllib.request


def run_functional_test(url: str) -> dict:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,800")

    # Capture browser console logs
    options.set_capability("goog:loggingPrefs", {"browser": "ALL"})

    driver = webdriver.Chrome(options=options)
    results = {}

    try:
        driver.get(url)
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )

        # --- Form & Input Analysis ---
        forms   = driver.find_elements(By.TAG_NAME, "form")
        inputs  = driver.find_elements(By.TAG_NAME, "input")
        buttons = driver.find_elements(By.TAG_NAME, "button")
        selects = driver.find_elements(By.TAG_NAME, "select")

        results["form_count"]     = len(forms)
        results["input_count"]    = len(inputs)
        results["button_count"]   = len(buttons)
        results["dropdown_count"] = len(selects)

        # Input type breakdown
        input_types = {}
        for inp in inputs:
            t = inp.get_attribute("type") or "text"
            input_types[t] = input_types.get(t, 0) + 1
        results["input_types"] = input_types

        # --- Cookies ---
        cookies = driver.get_cookies()
        results["cookie_count"] = len(cookies)
        results["cookie_names"] = [c["name"] for c in cookies]

        # --- Browser Console Errors ---
        try:
            logs = driver.get_log("browser")
            js_errors = [
                log["message"] for log in logs if log["level"] == "SEVERE"
            ]
        except Exception:
            js_errors = []
        results["js_errors"]       = js_errors
        results["js_error_count"]  = len(js_errors)

        # --- Broken Links Check (sample up to 10) ---
        all_links = driver.find_elements(By.TAG_NAME, "a")
        hrefs = list({
            a.get_attribute("href")
            for a in all_links
            if a.get_attribute("href") and a.get_attribute("href").startswith("http")
        })[:10]

        broken_links = []
        for link in hrefs:
            try:
                req = urllib.request.Request(link, method="HEAD",
                      headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    if resp.status >= 400:
                        broken_links.append({"url": link, "status": resp.status})
            except Exception as e:
                broken_links.append({"url": link, "error": str(e)})

        results["links_sampled"]  = len(hrefs)
        results["broken_links"]   = broken_links
        results["broken_count"]   = len(broken_links)

        results["status"] = "PASS"

    except Exception as e:
        results["status"] = "FAIL"
        results["error"]  = str(e)

    finally:
        driver.quit()

    return results


def print_report(results: dict):
    print("\n" + "=" * 55)
    print("  FUNCTIONAL SELENIUM TEST REPORT")
    print("=" * 55)

    simple_keys = ["status", "form_count", "input_count", "button_count",
                   "dropdown_count", "cookie_count", "js_error_count",
                   "links_sampled", "broken_count"]
    for key in simple_keys:
        if key in results:
            print(f"  {key:<22}: {results[key]}")

    if results.get("input_types"):
        print(f"\n  Input Type Breakdown:")
        for t, c in results["input_types"].items():
            print(f"    - {t}: {c}")

    if results.get("cookie_names"):
        print(f"\n  Cookies Found: {', '.join(results['cookie_names'])}")

    if results.get("js_errors"):
        print(f"\n  JS Errors:")
        for err in results["js_errors"]:
            print(f"    [ERROR] {err}")

    if results.get("broken_links"):
        print(f"\n  Broken Links:")
        for bl in results["broken_links"]:
            print(f"    {bl}")

    if results.get("error"):
        print(f"\n  [!] Error: {results['error']}")

    print("=" * 55)


if __name__ == "__main__":
    target_url = sys.argv[1] if len(sys.argv) > 1 else "https://example.com"
    print(f"\n[*] Running functional test on: {target_url}")
    report = run_functional_test(target_url)
    print_report(report)
