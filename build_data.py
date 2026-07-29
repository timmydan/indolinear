import os
import re
import json
import shutil
import xml.etree.ElementTree as ET

print("=== Starting build_data.py ===")

# Create output directories for public and dist
os.makedirs("public/data/chapters", exist_ok=True)
os.makedirs("dist/data/chapters", exist_ok=True)

# 1. Books Metadata
books_meta = {
    1: {"name": "Kejadian", "abbr": "Kej", "testament": "OT", "code": "Gen"},
    2: {"name": "Keluaran", "abbr": "Kel", "testament": "OT", "code": "Exod"},
    3: {"name": "Imamat", "abbr": "Im", "testament": "OT", "code": "Lev"},
    4: {"name": "Bilangan", "abbr": "Bil", "testament": "OT", "code": "Num"},
    5: {"name": "Ulangan", "abbr": "Ul", "testament": "OT", "code": "Deut"},
    6: {"name": "Yosua", "abbr": "Yos", "testament": "OT", "code": "Josh"},
    7: {"name": "Hakim-hakim", "abbr": "Hak", "testament": "OT", "code": "Judg"},
    8: {"name": "Rut", "abbr": "Rut", "testament": "OT", "code": "Ruth"},
    9: {"name": "1 Samuel", "abbr": "1Sam", "testament": "OT", "code": "1Sam"},
    10: {"name": "2 Samuel", "abbr": "2Sam", "testament": "OT", "code": "2Sam"},
    11: {"name": "1 Raja-raja", "abbr": "1Raj", "testament": "OT", "code": "1Kgs"},
    12: {"name": "2 Raja-raja", "abbr": "2Raj", "testament": "OT", "code": "2Kgs"},
    13: {"name": "1 Tawarikh", "abbr": "1Taw", "testament": "OT", "code": "1Chr"},
    14: {"name": "2 Tawarikh", "abbr": "2Taw", "testament": "OT", "code": "2Chr"},
    15: {"name": "Ezra", "abbr": "Ezr", "testament": "OT", "code": "Ezra"},
    16: {"name": "Nehemia", "abbr": "Neh", "testament": "OT", "code": "Neh"},
    17: {"name": "Ester", "abbr": "Est", "testament": "OT", "code": "Esth"},
    18: {"name": "Ayub", "abbr": "Ayb", "testament": "OT", "code": "Job"},
    19: {"name": "Mazmur", "abbr": "Mzm", "testament": "OT", "code": "Ps"},
    20: {"name": "Amsal", "abbr": "Ams", "testament": "OT", "code": "Prov"},
    21: {"name": "Pengkhotbah", "abbr": "Pkh", "testament": "OT", "code": "Eccl"},
    22: {"name": "Kidung Agung", "abbr": "Kid", "testament": "OT", "code": "Song"},
    23: {"name": "Yesaya", "abbr": "Yes", "testament": "OT", "code": "Isa"},
    24: {"name": "Yeremia", "abbr": "Yer", "testament": "OT", "code": "Jer"},
    25: {"name": "Ratapan", "abbr": "Rat", "testament": "OT", "code": "Lam"},
    26: {"name": "Yehezkiel", "abbr": "Yhk", "testament": "OT", "code": "Ezek"},
    27: {"name": "Daniel", "abbr": "Dan", "testament": "OT", "code": "Dan"},
    28: {"name": "Hosea", "abbr": "Hos", "testament": "OT", "code": "Hos"},
    29: {"name": "Yoel", "abbr": "Yl", "testament": "OT", "code": "Joel"},
    30: {"name": "Amos", "abbr": "Am", "testament": "OT", "code": "Amos"},
    31: {"name": "Obaja", "abbr": "Ob", "testament": "OT", "code": "Obad"},
    32: {"name": "Yunus", "abbr": "Yun", "testament": "OT", "code": "Jonah"},
    33: {"name": "Mikha", "abbr": "Mik", "testament": "OT", "code": "Mic"},
    34: {"name": "Nahum", "abbr": "Nah", "testament": "OT", "code": "Nah"},
    35: {"name": "Habakuk", "abbr": "Hab", "testament": "OT", "code": "Hab"},
    36: {"name": "Zefanya", "abbr": "Zef", "testament": "OT", "code": "Zeph"},
    37: {"name": "Hagai", "abbr": "Hag", "testament": "OT", "code": "Hag"},
    38: {"name": "Zakharia", "abbr": "Zak", "testament": "OT", "code": "Zech"},
    39: {"name": "Maleakhi", "abbr": "Mal", "testament": "OT", "code": "Mal"},
    # NT
    40: {"name": "Matius", "abbr": "Mat", "testament": "NT", "code": "MAT"},
    41: {"name": "Markus", "abbr": "Mrk", "testament": "NT", "code": "MRK"},
    42: {"name": "Lukas", "abbr": "Luk", "testament": "NT", "code": "LUK"},
    43: {"name": "Yohanes", "abbr": "Yoh", "testament": "NT", "code": "JHN"},
    44: {"name": "Kisah Para Rasul", "abbr": "Kis", "testament": "NT", "code": "ACT"},
    45: {"name": "Roma", "abbr": "Rom", "testament": "NT", "code": "ROM"},
    46: {"name": "1 Korintus", "abbr": "1Kor", "testament": "NT", "code": "1CO"},
    47: {"name": "2 Korintus", "abbr": "2Kor", "testament": "NT", "code": "2CO"},
    48: {"name": "Galatia", "abbr": "Gal", "testament": "NT", "code": "GAL"},
    49: {"name": "Efesus", "abbr": "Efs", "testament": "NT", "code": "EPH"},
    50: {"name": "Filipi", "abbr": "Flp", "testament": "NT", "code": "PHP"},
    51: {"name": "Kolose", "abbr": "Kol", "testament": "NT", "code": "COL"},
    52: {"name": "1 Tesalonika", "abbr": "1Tes", "testament": "NT", "code": "1TH"},
    53: {"name": "2 Tesalonika", "abbr": "2Tes", "testament": "NT", "code": "2TH"},
    54: {"name": "1 Timotius", "abbr": "1Tim", "testament": "NT", "code": "1TI"},
    55: {"name": "2 Timotius", "abbr": "2Tim", "testament": "NT", "code": "2TI"},
    56: {"name": "Titus", "abbr": "Tit", "testament": "NT", "code": "TIT"},
    57: {"name": "Filemon", "abbr": "Flm", "testament": "NT", "code": "PHM"},
    58: {"name": "Ibrani", "abbr": "Ibr", "testament": "NT", "code": "HEB"},
    59: {"name": "Yakobus", "abbr": "Yak", "testament": "NT", "code": "JAS"},
    60: {"name": "1 Petrus", "abbr": "1Pet", "testament": "NT", "code": "1PE"},
    61: {"name": "2 Petrus", "abbr": "2Pet", "testament": "NT", "code": "2PE"},
    62: {"name": "1 Yohanes", "abbr": "1Yoh", "testament": "NT", "code": "1JO"},
    63: {"name": "2 Yohanes", "abbr": "2Yoh", "testament": "NT", "code": "2JO"},
    64: {"name": "3 Yohanes", "abbr": "3Yoh", "testament": "NT", "code": "3JO"},
    65: {"name": "Yudas", "abbr": "Yud", "testament": "NT", "code": "JUD"},
    66: {"name": "Wahyu", "abbr": "Wah", "testament": "NT", "code": "REV"}
}

# 2. Parse vrefs.sql
print("1. Parsing vrefs.sql...")
vrefs = {} # ayat_id -> {book, chapter, verse}
verse_to_ayat = {} # (book, chapter, verse) -> ayat_id
book_chapters = {} # book -> dict of chapter -> list of verses

with open("data/vrefs.sql", encoding="utf-8", errors="ignore") as f:
    for line in f:
        if line.startswith("("):
            m = re.findall(r"\d+", line)
            if len(m) >= 4:
                v_id, b, c, v = int(m[0]), int(m[1]), int(m[2]), int(m[3])
                vrefs[v_id] = {"book": b, "chapter": c, "verse": v}
                verse_to_ayat[(b, c, v)] = v_id
                if b not in book_chapters:
                    book_chapters[b] = {}
                if c not in book_chapters[b]:
                    book_chapters[b][c] = []
                book_chapters[b][c].append(v)

# Save books.json
books_list = []
for b_id in range(1, 67):
    meta = books_meta[b_id]
    chaps = sorted(list(book_chapters.get(b_id, {}).keys()))
    total_verses = sum(len(book_chapters[b_id][ch]) for ch in chaps)
    books_list.append({
        "id": b_id,
        "name": meta["name"],
        "abbr": meta["abbr"],
        "testament": meta["testament"],
        "code": meta["code"],
        "chaptersCount": len(chaps),
        "totalVerses": total_verses
    })

with open("public/data/books.json", "w", encoding="utf-8") as f:
    json.dump(books_list, f, ensure_ascii=False, indent=2)

with open("dist/data/books.json", "w", encoding="utf-8") as f:
    json.dump(books_list, f, ensure_ascii=False, indent=2)

print("Saved books.json.")

# 3. Parse bib_id_ayt_texts.sql
print("2. Parsing bib_id_ayt_texts.sql...")
ayt_texts = {}
ayt_titles = {}
with open("data/bib_id_ayt_texts.sql", encoding="utf-8", errors="ignore") as f:
    for line in f:
        if line.startswith("("):
            m_id = re.search(r"^\((\d+),", line)
            parts = re.findall(r"'([^'\\]*(?:\\.[^'\\]*)*)'", line)
            if m_id and len(parts) >= 1:
                v_id = int(m_id.group(1))
                text_clean = parts[0].replace('<t />', '').strip()
                title_clean = parts[1].strip() if len(parts) > 1 else ''
                ayt_texts[v_id] = text_clean
                if title_clean:
                    ayt_titles[v_id] = title_clean

# 4. Parse Linkages
print("3. Parsing linkages...")
heb_linkage = {} # (ayat, bhs_pos) -> {ayt_kata, strong}
with open("data/itl_linkage_heb2ayt.sql", encoding="utf-8", errors="ignore") as f:
    for line in f:
        if line.startswith("("):
            m = re.match(r"\((\d+),\s*(\d+),\s*'([^']*)',\s*(\d+),\s*(\d+|NULL)", line)
            if m:
                bhs_ayat = int(m.group(1))
                ayt_pos = int(m.group(2))
                ayt_kata = m.group(3)
                bhs_pos = int(m.group(4))
                str_num = m.group(5)
                heb_linkage[(bhs_ayat, bhs_pos)] = {
                    "ayt_kata": ayt_kata,
                    "ayt_pos": ayt_pos,
                    "strong": int(str_num) if str_num != "NULL" else 0
                }

grk_linkage = {} # (ayat, wh_pos) -> {ayt_kata, strong}
with open("data/itl_linkage_grk2ayt.sql", encoding="utf-8", errors="ignore") as f:
    for line in f:
        if line.startswith("("):
            m = re.match(r"\((\d+),\s*(\d+),\s*'([^']*)',\s*(\d+),\s*(\d+|NULL)", line)
            if m:
                wh_ayat = int(m.group(1))
                ayt_pos = int(m.group(2))
                ayt_kata = m.group(3)
                wh_pos = int(m.group(4))
                str_num = m.group(5)
                grk_linkage[(wh_ayat, wh_pos)] = {
                    "ayt_kata": ayt_kata,
                    "ayt_pos": ayt_pos,
                    "strong": int(str_num) if str_num != "NULL" else 0
                }

# 5. Parse Strong Lexicons
def parse_sql_tuples(filepath, prefix):
    entries = {}
    with open(filepath, encoding='utf-8', errors='ignore') as f:
        content = f.read()

    pos = 0
    while True:
        idx = content.find('INSERT INTO', pos)
        if idx == -1:
            break
        v_idx = content.find('VALUES', idx)
        if v_idx == -1:
            break
        pos = v_idx + 6

        length = len(content)
        i = pos
        while i < length:
            while i < length and content[i] not in ('(', ';'):
                i += 1
            if i >= length or content[i] == ';':
                break
            i += 1
            fields = []
            curr = []
            in_string = False
            while i < length:
                ch = content[i]
                if in_string:
                    if ch == "'":
                        if i + 1 < length and content[i+1] == "'":
                            curr.append("'")
                            i += 1
                        else:
                            in_string = False
                    else:
                        curr.append(ch)
                else:
                    if ch == "'":
                        in_string = True
                    elif ch == ',':
                        fields.append("".join(curr).strip())
                        curr = []
                    elif ch == ')':
                        fields.append("".join(curr).strip())
                        i += 1
                        break
                    else:
                        curr.append(ch)
                i += 1

            if len(fields) >= 10:
                try:
                    s_id = int(fields[0])
                    if s_id > 0:
                        key = f"{prefix}{s_id}"
                        raw_def = fields[9].strip()
                        cleaned_def = re.sub(r"\\\\[0-9a-zA-Z\\s]*\\\\", "", raw_def)
                        cleaned_def = re.sub(r"\\~[^\~]*\\~", "", cleaned_def)
                        cleaned_def = re.sub(r"\\\^[^\^]*\\\^", "", cleaned_def)
                        
                        entries[key] = {
                            "id": key,
                            "strong_num": s_id,
                            "word": fields[2].replace('\\~', '').replace('\\^', '').strip(),
                            "pron": fields[3].replace('\\\\', '').replace('\\@', '').strip(),
                            "kind": fields[6].strip(),
                            "av": fields[7].strip(),
                            "count": int(fields[8]) if fields[8].isdigit() else 0,
                            "def_en": raw_def,
                            "def_clean": cleaned_def
                        }
                except ValueError:
                    pass
    return entries

print("4. Parsing Strong Lexicons...")
strong_h = parse_sql_tuples("data/hebrew.sql", "H")
strong_g = parse_sql_tuples("data/greek.sql", "G")

with open("public/data/strong_hebrew.json", "w", encoding="utf-8") as f:
    json.dump(strong_h, f, ensure_ascii=False)
with open("dist/data/strong_hebrew.json", "w", encoding="utf-8") as f:
    json.dump(strong_h, f, ensure_ascii=False)

with open("public/data/strong_greek.json", "w", encoding="utf-8") as f:
    json.dump(strong_g, f, ensure_ascii=False)
with open("dist/data/strong_greek.json", "w", encoding="utf-8") as f:
    json.dump(strong_g, f, ensure_ascii=False)

print(f"Saved Strong lexicons: {len(strong_h)} Hebrew, {len(strong_g)} Greek.")

# 6. Morphology Decoders
def decode_greek_morph(morph_str):
    if not morph_str:
        return "Teks Yunani"
    parts = morph_str.split('-')
    pos_map = {
        'N': 'Nomina (Kata Benda)',
        'V': 'Verba (Kata Kerja)',
        'A': 'Adjektiva (Kata Sifat)',
        'T': 'Artikel Definit (Kata Sandang)',
        'P': 'Pronomina (Kata Ganti)',
        'PREP': 'Preposisi (Kata Depan)',
        'CONJ': 'Konjungsi (Kata Sambung)',
        'ADV': 'Adverbia (Kata Keterangan)',
        'PRT': 'Partikel',
        'I': 'Interjeksi (Kata Seru)',
        'D': 'Demonstratif (Kata Tunjuk)'
    }
    case_map = {'N': 'Nominatif', 'G': 'Genitif', 'D': 'Datif', 'A': 'Akusatif', 'V': 'Vokatif'}
    num_map = {'S': 'Tunggal', 'P': 'Jamak'}
    gen_map = {'M': 'Maskulin (Laki-laki)', 'F': 'Feminin (Perempuan)', 'N': 'Netral'}
    tense_map = {'P': 'Presens (Saat Ini)', 'I': 'Imperfek (Lampau Berlangsung)', 'F': 'Futurum (Akan Datang)', 'A': 'Aoris (Lampau Selesai)', 'R': 'Perfek (Sempurna)', 'L': 'Pluperfek (Maha Lampau)'}
    voice_map = {'A': 'Aktif', 'M': 'Medium (Middle)', 'P': 'Pasif'}
    mood_map = {'I': 'Indikatif', 'D': 'Imperatif', 'S': 'Subjungtif', 'O': 'Optatif', 'N': 'Infinitif', 'P': 'Partisip'}
    person_map = {'1': 'Orang ke-1', '2': 'Orang ke-2', '3': 'Orang ke-3'}

    pos_code = parts[0]
    out = [pos_map.get(pos_code, pos_code)]
    if len(parts) > 1:
        details = parts[1]
        if pos_code == 'V':
            if len(details) >= 3:
                out.append(tense_map.get(details[0], details[0]))
                out.append(voice_map.get(details[1], details[1]))
                out.append(mood_map.get(details[2], details[2]))
            if len(parts) > 2:
                for c in parts[2]:
                    if c in person_map: out.append(person_map[c])
                    elif c in case_map: out.append(case_map[c])
                    elif c in num_map: out.append(num_map[c])
                    elif c in gen_map: out.append(gen_map[c])
        else:
            for c in details:
                if c in case_map: out.append(case_map[c])
                elif c in num_map: out.append(num_map[c])
                elif c in gen_map: out.append(gen_map[c])
    return ", ".join(out)

def decode_hebrew_morph(morph_str):
    if not morph_str:
        return "Teks Ibrani"
    cleaned = morph_str.replace("H", "")
    parts = cleaned.split("/")
    decoded_parts = []
    
    stem_map = {'q': 'Qal', 'N': 'Nifal', 'p': 'Piel', 'P': 'Pual', 'h': 'Hifil', 'H': 'Hofal', 't': 'Hitpael'}
    conj_map = {'p': 'Perfek', 'i': 'Imperfek', 'w': 'Waw Konsekutif Imperfek', 'c': 'Imperatif', 'a': 'Infinitif Absolut', 'v': 'Partisip Aktif', 's': 'Partisip Pasif'}
    type_map = {'R': 'Preposisi', 'Td': 'Artikel Definit (הַ)', 'C': 'Konjungsi (וְ)', 'To': 'Tanda Objek (אֵת)', 'N': 'Nomina', 'V': 'Verba', 'A': 'Adjektiva', 'P': 'Pronomina', 'D': 'Adverbia'}
    gen_map = {'m': 'Laki-laki', 'f': 'Perempuan', 'b': 'Kedua Jenis'}
    num_map = {'s': 'Tunggal', 'd': 'Ganda (Dual)', 'p': 'Jamak'}
    state_map = {'a': 'Absolut', 'c': 'Konstruk (Terikat)', 'e': 'Emfatik'}
    person_map = {'1': 'Orang ke-1', '2': 'Orang ke-2', '3': 'Orang ke-3'}

    for part in parts:
        curr = []
        if part.startswith('V'):
            curr.append('Verba')
            if len(part) > 1 and part[1] in stem_map: curr.append(stem_map[part[1]])
            if len(part) > 2 and part[2] in conj_map: curr.append(conj_map[part[2]])
            if len(part) > 3 and part[3] in person_map: curr.append(person_map[part[3]])
            if len(part) > 4 and part[4] in gen_map: curr.append(gen_map[part[4]])
            if len(part) > 5 and part[5] in num_map: curr.append(num_map[part[5]])
        elif part.startswith('N'):
            curr.append('Nomina')
            if len(part) > 1:
                for c in part[1:]:
                    if c in gen_map: curr.append(gen_map[c])
                    elif c in num_map: curr.append(num_map[c])
                    elif c in state_map: curr.append(state_map[c])
        else:
            t = type_map.get(part, part)
            curr.append(t)
        decoded_parts.append(" ".join(curr))
    return " + ".join(decoded_parts)

# 7. Process OT Hebrew XMLs
print("5. Processing OT Hebrew XMLs...")
ot_data = {} # (book_id, chap) -> list of verses

ot_books = [
    (1, 'Gen'), (2, 'Exod'), (3, 'Lev'), (4, 'Num'), (5, 'Deut'), (6, 'Josh'), (7, 'Judg'), (8, 'Ruth'),
    (9, '1Sam'), (10, '2Sam'), (11, '1Kgs'), (12, '2Kgs'), (13, '1Chr'), (14, '2Chr'), (15, 'Ezra'), (16, 'Neh'),
    (17, 'Esth'), (18, 'Job'), (19, 'Ps'), (20, 'Prov'), (21, 'Eccl'), (22, 'Song'), (23, 'Isa'), (24, 'Jer'),
    (25, 'Lam'), (26, 'Ezek'), (27, 'Dan'), (28, 'Hos'), (29, 'Joel'), (30, 'Amos'), (31, 'Obad'), (32, 'Jonah'),
    (33, 'Mic'), (34, 'Nah'), (35, 'Hab'), (36, 'Zeph'), (37, 'Hag'), (38, 'Zech'), (39, 'Mal')
]

for b_id, code in ot_books:
    xml_path = f"data_downloads/hebrew/{code}.xml"
    if not os.path.exists(xml_path):
        continue
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        for verse_elem in root.iter('{http://www.bibletechnologies.net/2003/OSIS/namespace}verse'):
            osis_id = verse_elem.attrib.get('osisID', '')
            m = re.match(r"^[A-Za-z0-9]+\.(\d+)\.(\d+)$", osis_id)
            if not m:
                continue
            chap = int(m.group(1))
            v_num = int(m.group(2))
            
            ayat_id = verse_to_ayat.get((b_id, chap, v_num))
            if not ayat_id:
                continue

            words = []
            pos_counter = 1
            for w in verse_elem.iter('{http://www.bibletechnologies.net/2003/OSIS/namespace}w'):
                text = (w.text or '').strip()
                lemma_attr = w.attrib.get('lemma', '')
                morph_attr = w.attrib.get('morph', '')
                
                str_match = re.search(r"(\d+)", lemma_attr)
                str_num = int(str_match.group(1)) if str_match else 0
                strong_code = f"H{str_num}" if str_num > 0 else ""
                
                link = heb_linkage.get((ayat_id, pos_counter), {})
                ayt_w = link.get('ayt_kata', '')
                
                words.append({
                    "pos": pos_counter,
                    "word_orig": text,
                    "strong": strong_code,
                    "morph": morph_attr,
                    "morph_id": decode_hebrew_morph(morph_attr),
                    "ayt_word": ayt_w
                })
                pos_counter += 1
            
            key = (b_id, chap)
            if key not in ot_data:
                ot_data[key] = []
            ot_data[key].append({
                "book": b_id,
                "chapter": chap,
                "verse": v_num,
                "ayat_id": ayat_id,
                "title": ayt_titles.get(ayat_id, ""),
                "ayt_text": ayt_texts.get(ayat_id, ""),
                "words": words
            })
    except Exception as e:
        print(f"Error parsing OT {code}: {e}")

print(f"Processed {len(ot_data)} OT chapters.")

# 8. Process NT Greek XMLs (Ref-attribute based parsing for 100% complete verse extraction)
print("6. Processing NT Greek XMLs...")
nt_data = {} # (book_id, chap) -> list of verses

nt_books = [
    (40, 'MAT'), (41, 'MRK'), (42, 'LUK'), (43, 'JHN'), (44, 'ACT'), (45, 'ROM'), (46, '1CO'), (47, '2CO'),
    (48, 'GAL'), (49, 'EPH'), (50, 'PHP'), (51, 'COL'), (52, '1TH'), (53, '2TH'), (54, '1TI'), (55, '2TI'),
    (56, 'TIT'), (57, 'PHM'), (58, 'HEB'), (59, 'JAS'), (60, '1PE'), (61, '2PE'), (62, '1JO'), (63, '2JO'),
    (64, '3JO'), (65, 'JUD'), (66, 'REV')
]

for b_id, code in nt_books:
    xml_path = f"data_downloads/greek/{code}.xml"
    if not os.path.exists(xml_path):
        continue
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        
        # Extract all words grouped by (chap, verse) via ref attribute e.g. ref="MAT 1:2!5"
        verse_words_map = {} # (chap_num, verse_num) -> list of word dicts
        
        for w in root.iter('w'):
            ref = w.attrib.get('ref', '')
            if not ref:
                continue
            parts = ref.split('!')
            cv = parts[0].split(' ')
            if len(cv) != 2:
                continue
            ch_v = cv[1].split(':')
            chap_num = int(ch_v[0])
            verse_num = int(ch_v[1])
            
            unicode_word = w.attrib.get('unicode', w.text or '')
            strong_num = w.attrib.get('strong', '0')
            str_val = int(strong_num) if strong_num.isdigit() else 0
            strong_code = f"G{str_val}" if str_val > 0 else ""
            morph_code = w.attrib.get('morph', '')
            gloss_en = w.attrib.get('gloss', '')
            
            key = (chap_num, verse_num)
            if key not in verse_words_map:
                verse_words_map[key] = []
            verse_words_map[key].append({
                "unicode": unicode_word,
                "strong": strong_code,
                "morph": morph_code,
                "gloss": gloss_en
            })
            
        for (chap_num, verse_num), w_list in verse_words_map.items():
            ayat_id = verse_to_ayat.get((b_id, chap_num, verse_num))
            if not ayat_id:
                continue
            
            words = []
            for pos_idx, w_data in enumerate(w_list, 1):
                link = grk_linkage.get((ayat_id, pos_idx), {})
                ayt_w = link.get('ayt_kata', '')
                
                words.append({
                    "pos": pos_idx,
                    "word_orig": w_data["unicode"],
                    "strong": w_data["strong"],
                    "morph": w_data["morph"],
                    "morph_id": decode_greek_morph(w_data["morph"]),
                    "gloss_en": w_data["gloss"],
                    "ayt_word": ayt_w
                })
                
            key = (b_id, chap_num)
            if key not in nt_data:
                nt_data[key] = []
            nt_data[key].append({
                "book": b_id,
                "chapter": chap_num,
                "verse": verse_num,
                "ayat_id": ayat_id,
                "title": ayt_titles.get(ayat_id, ""),
                "ayt_text": ayt_texts.get(ayat_id, ""),
                "words": words
            })
    except Exception as e:
        print(f"Error parsing NT {code}: {e}")

print(f"Processed {len(nt_data)} NT chapters.")

# 9. Save Chapter JSON Files to public and dist
print("7. Saving Chapter JSON Files...")
count_files = 0
for (b_id, chap), v_list in {**ot_data, **nt_data}.items():
    v_list.sort(key=lambda x: x["verse"])
    
    pub_file = f"public/data/chapters/{b_id}_{chap}.json"
    with open(pub_file, "w", encoding="utf-8") as f:
        json.dump(v_list, f, ensure_ascii=False)
        
    dist_file = f"dist/data/chapters/{b_id}_{chap}.json"
    with open(dist_file, "w", encoding="utf-8") as f:
        json.dump(v_list, f, ensure_ascii=False)
        
    count_files += 1

print(f"Successfully created {count_files} chapter JSON files in public and dist!")
print("=== Data Build Complete! ===")
