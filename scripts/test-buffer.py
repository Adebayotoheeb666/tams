import requests

# 1. Use the env variable access token
BUFFER_ACCESS_TOKEN = "F15NFkzUuRJ0sSM5gG_WVs3VFZQNuvQ8BnZIn586cGw"

# 2. Configure headers for Buffer API v1
url = "https://api.bufferapp.com/1/profiles.json"
headers = {
    "Authorization": f"Bearer {BUFFER_ACCESS_TOKEN}"
}

print("Connecting to Buffer API...")

try:
    # 3. Make the API request
    response = requests.get(url, headers=headers)
    
    # Check for authentication errors
    if response.status_code == 401:
        print("❌ Authentication Failed: Your Access Token is invalid or expired.")
    elif response.status_code == 200:
        print("✅ Connection Successful!\n")
        profiles = response.json()
        
        print("--- Connected Profiles Found ---")
        if isinstance(profiles, list):
            for profile in profiles:
                service_name = profile.get('service', 'unknown').upper()
                profile_id = profile.get('id')
                formatted_name = profile.get('formatted_username', 'No Name')
                
                print(f"Service: {service_name}")
                print(f"  Name:  {formatted_name}")
                print(f"  ID:    {profile_id}")
                print("-" * 32)
        else:
            print("Response format:")
            print(profiles)
            
    else:
        print(f"❌ Error: Received status code {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"An error occurred: {e}")
