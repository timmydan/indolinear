import sys

def parse_sql_tuples(filepath):
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
            i += 1 # skip '('
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
                        entries[s_id] = {
                            "id": s_id,
                            "word_id": fields[1] if fields[1] != 'NULL' else None,
                            "word": fields[2],
                            "pron": fields[3],
                            "origin": fields[4],
                            "source": fields[5],
                            "kind": fields[6],
                            "av": fields[7],
                            "count": int(fields[8]) if fields[8].isdigit() else 0,
                            "def": fields[9]
                        }
                except ValueError:
                    pass
    return entries

h = parse_sql_tuples('data/hebrew.sql')
g = parse_sql_tuples('data/greek.sql')
print(f"Hebrew Strong entries: {len(h)}")
print(f"Greek Strong entries: {len(g)}")
if 7225 in h:
    print("H7225:", h[7225]['word'], "|", repr(h[7225]['def'][:60]))
if 976 in g:
    print("G976:", g[976]['word'], "|", repr(g[976]['def'][:60]))
