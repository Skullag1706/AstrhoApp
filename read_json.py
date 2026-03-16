import json
import os

file_path = r'c:\Users\azeca\Desktop\Programacion\GIT\AstrhoApp\temp_services.json'
try:
    with open(file_path, 'r', encoding='utf-16') as f:
        data = json.load(f)
        print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error reading with utf-16: {e}")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error reading with utf-8: {e}")
