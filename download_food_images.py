import urllib.request
import urllib.parse
import json
import os
from PIL import Image

headers = {'User-Agent': 'NammaYatraKarnatakaTravelApp/1.0 (contact: vishal@nammayatra.ai)'}

food_mappings = {
    'food_dharwad_peda.jpg': 'File:Dharwad peda.jpg',
    'food_mysore_pak.jpg': 'File:Mysore pak.jpg',
    'food_jolada_rotti.jpg': 'File:Jowar Roti.jpg',
    'food_coorg_akki_rotti.jpg': 'File:Akki Rotti.jpg',
    'food_mangaluru_neer_dosa.jpg': 'File:Neer-dosa-.jpg',
    'food_udupi_meal.jpg': "File:Udupi's veg meal.jpg"
}

output_dir = os.path.join(os.getcwd(), 'public', 'images')

for filename, wiki_title in food_mappings.items():
    api_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(wiki_title)}&prop=imageinfo&iiprop=url|size&format=json"
    req = urllib.request.Request(api_url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            for pid, page in pages.items():
                ii = page.get('imageinfo', [{}])[0]
                img_url = ii.get('url')
                if img_url:
                    print(f"Downloading {wiki_title} from {img_url}...")
                    img_req = urllib.request.Request(img_url, headers=headers)
                    target_path = os.path.join(output_dir, filename)
                    with urllib.request.urlopen(img_req) as img_resp, open(target_path, 'wb') as f:
                        f.write(img_resp.read())
                    # Optimize/resize if very large
                    with Image.open(target_path) as im:
                        im.thumbnail((1200, 800))
                        im.convert('RGB').save(target_path, 'JPEG', quality=88)
                    print(f"Saved and optimized: {filename}")
    except Exception as e:
        print(f"Failed {filename}: {e}")

# For Bengaluru Darshini: we have exp_food_culture.jpg which is authentic filter coffee and crispy masala dosa!
# Let's save a clean copy as food_bengaluru_darshini.jpg and food_mysore_dosa.jpg
print("Done downloading!")
