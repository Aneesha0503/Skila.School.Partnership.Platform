import os
import re

print("=== SCANNING FOR HARDCODED MOCKS & DUPLICATIONS ===")

# Check for hardcoded mock names or arrays
patterns = [
    r'mock_', r'sample_', r'dummy', r'test_school', r'temp_pwd', r'ROSTER_FIRST_NAMES',
    r'sample_partners', r'TODO', r'FIXME'
]

backend_hits = {}
with open('backend/main.py', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        for p in patterns:
            if re.search(p, line, re.IGNORECASE):
                backend_hits.setdefault(p, []).append((i, line.strip()[:80]))

print(f"Backend hardcoded/mock pattern matches:")
for p, matches in backend_hits.items():
    print(f"  Pattern '{p}': {len(matches)} occurrences (first at line {matches[0][0]}: {matches[0][1]})")

# Check frontend files
fe_files = []
for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
            fe_files.append(os.path.join(root, file))

print(f"\nFrontend files scanned: {len(fe_files)}")
fe_hits = {}
for path in fe_files:
    rel = os.path.relpath(path, 'frontend/src')
    with open(path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            for p in patterns:
                if re.search(p, line, re.IGNORECASE):
                    fe_hits.setdefault(rel, []).append((i, p, line.strip()[:80]))

for rel, matches in fe_hits.items():
    print(f"  {rel}: {len(matches)} matches")
    for m in matches[:2]:
        print(f"    Line {m[0]} [{m[1]}]: {m[2]}")

