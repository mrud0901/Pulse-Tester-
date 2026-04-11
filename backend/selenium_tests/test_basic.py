"""
test_basic.py
=============
Basic Selenium test: checks page availability, title, URL,
and fundamental DOM elements.

Requirements:
    pip install selenium

Usage:
    python test_basic.py https://example.com
"""

import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def run_basic_test(url: str) -> dict:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,800")

    driver = webdriver.Chrome(options=options)
    results = {}

    try:
        start = time.time()
        driver.get(url)

        # Wait for page body to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        load_time_ms = round((time.time() - start) * 1000)

        # --- Basic Info ---
        results["url_requested"]  = url
        results["url_final"]      = driver.current_url
        results["page_title"]     = driver.title
        results["load_time_ms"]   = load_time_ms

        # --- DOM counts ---
        results["link_count"]     = len(driver.find_elements(By.TAG_NAME, "a"))
        results["image_count"]    = len(driver.find_elements(By.TAG_NAME, "img"))
        results["heading_count"]  = len(driver.find_elements(By.CSS_SELECTOR, "h1,h2,h3"))

        # --- First H1 ---
        h1_elements = driver.find_elements(By.TAG_NAME, "h1")
        results["first_h1"] = h1_elements[0].text.strip() if h1_elements else "Not found"

        # --- Meta description ---
        meta = driver.find_elements(By.CSS_SELECTOR, 'meta[name="description"]')
        results["meta_description"] = meta[0].get_attribute("content") if meta else "Missing"

        results["status"] = "PASS"

    except Exception as e:
        results["status"] = "FAIL"
        results["error"]  = str(e)

    finally:
        driver.quit()

    return results


def print_report(results: dict):
    print("\n" + "=" * 55)
    print("  BASIC SELENIUM TEST REPORT")
    print("=" * 55)
    for key, value in results.items():
        print(f"  {key:<22}: {value}")
    print("=" * 55)


if __name__ == "__main__":
    target_url = sys.argv[1] if len(sys.argv) > 1 else "https://example.com"
    print(f"\n[*] Running basic test on: {target_url}")
    report = run_basic_test(target_url)
    print_report(report)
