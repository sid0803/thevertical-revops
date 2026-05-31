import urllib.request
import re
import urllib.parse

file_ids = [
    "1LQu5SO1SX-mqP8U9nYh6Qbda3L0g-yeX",
    "1TUqlfv9ehNctnm_KYC9Vu-zWE0kvJGun",
    "1bsfVGgdA7mZapbYcPvxsirwE3ZWH8rtK",
    "1eBwf8nrjXSIpIeo8g7TsvC5VpgsYgFuo",
    "1mCyGdZ6XOCgjDTwyoqCFW4G-zkd1UTe2",
    "1tdvz1718NIgmfrP3TVnX4eHUnuD1fmAg",
    "1w8CwkE5NBVSQPEKakkLT17joBVqjWwl7",
    "1wUr9AOZ9gdWSOgD5W2hIOfB3B4wzL2f1"
]

for fid in file_ids:
    url = f"https://drive.google.com/file/d/{fid}/view?usp=sharing"
    # Or if folder
    if fid in ["1LQu5SO1SX-mqP8U9nYh6Qbda3L0g-yeX", "1wUr9AOZ9gdWSOgD5W2hIOfB3B4wzL2f1"]:
        url = f"https://drive.google.com/drive/folders/{fid}?usp=sharing"
    
    print(f"\nFetching {url} ...")
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8', errors='ignore')
            title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
            title = title_match.group(1) if title_match else "No Title"
            print(f"Title: {title}")
            
            # Print a snippet of the body or look for script data
            if "login" in response.url or "accounts.google.com" in response.url:
                print("Redirected to Login: True")
            else:
                print("Redirected to Login: False")
                # Look for file metadata in HTML
                meta_match = re.search(r'meta name="description" content="(.*?)"', html)
                if meta_match:
                    print(f"Description: {meta_match.group(1)}")
    except Exception as e:
        print(f"Error: {e}")
