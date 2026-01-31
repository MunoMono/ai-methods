# PID Sync Guide - Permanent Solution

## The Problem (Solved)
The PID sync kept breaking due to:
1. **Wrong logic**: Counted media items instead of PDF files
2. **Database password**: Kept reverting after container restarts
3. **No ML gate**: Didn't properly filter by `use_for_ml` flag

## The Solution

### Corrected Script: `quick_sync_pids.py`
- ✅ Counts **actual PDF files** (not media items)
- ✅ Implements **ML gate**: Only counts PDFs in media items where `use_for_ml=TRUE`
- ✅ Uses **backend infrastructure**: Direct database access via LocalSessionLocal
- ✅ **Parameterized queries**: No SQL injection, proper JSON handling
- ✅ **Provenance tracking**: Metadata includes sync timestamps

### Correct Counts
- Bruce Archer collection: **4 PDFs** (media item 3 has 12 PDFs but ML=FALSE → excluded)
- Kenneth Agnew collection: **7 PDFs** 
- RCA Prospectuses: **20 PDFs** (not 1!)
- RCA Rector's reports: **16 PDFs** (not 1!)

## How to Sync PIDs (Permanent Method)

### Option 1: Automated on Deployment
```bash
ssh root@104.248.170.26 "cd /root/ai-methods && ./startup-sync.sh"
```

### Option 2: Manual Sync
```bash
# From local machine
scp quick_sync_pids.py root@104.248.170.26:/tmp/quick_sync.py
ssh root@104.248.170.26 "
  docker cp /tmp/quick_sync.py epistemic-drift-backend:/app/quick_sync.py &&
  docker exec epistemic-drift-db psql -U postgres -c \"ALTER USER postgres WITH PASSWORD 'postgres';\" &&
  docker restart epistemic-drift-backend &&
  sleep 5 &&
  docker exec epistemic-drift-backend python /app/quick_sync.py
"
```

### Option 3: Inside Backend Container
```bash
ssh root@104.248.170.26
docker exec -it epistemic-drift-backend bash
python /app/quick_sync.py
```

## Password Fix (Permanent)
The database password issue is fixed by:
1. **Migration 000_init_password.sql**: Runs on database init
2. **startup-sync.sh**: Ensures password is correct before sync
3. **Environment variables**: Backend uses `POSTGRES_PASSWORD` from .env

## Verification
```bash
# Check database has PIDs
ssh root@104.248.170.26 "docker exec epistemic-drift-db psql -U postgres -d epistemic_drift -c 'SELECT pid, title, pdf_count FROM documents WHERE pid IS NOT NULL;'"

# Expected output:
#      pid       |              title              | pdf_count 
# ---------------+---------------------------------+-----------
#  873981573030  | Bruce Archer collection         |         4
#  451248821104  | Kenneth Agnew collection        |         7
#  880612075513  | RCA Prospectuses | 1967-85      |        20
#  124881079617  | RCA Rector's reports | 1967-85  |        16
```

## Critical: ML Gate Implementation
The sync correctly implements the ML gate:
```python
# For each media item
digital_assets = media.get('digital_assets', [])
use_for_ml = any(asset.get('use_for_ml', False) 
                 for asset in digital_assets if isinstance(asset, dict))

# If ML gate passed, count ACTUAL PDF files
if use_for_ml:
    pdf_files = media.get('pdf_files', [])
    pdf_count += len(pdf_files)  # Count files, not items!
```

This ensures only PDFs in ML-approved media items are counted.

## Files to Keep
- ✅ `quick_sync_pids.py` - Working sync script
- ✅ `startup-sync.sh` - Automated password fix + sync
- ✅ `backend/migrations/000_init_password.sql` - Password init
- ✅ `analyze_graphql_data.py` - Audit tool for GraphQL responses

## Files to Ignore
- ❌ `fetch_and_sync_pids.py` - Broken SSH/shell approach
- ❌ `sync_parent_pids.py` - Overcomplicated strategic rewrite

## This Won't Break Again Because:
1. **Committed to git**: Code is version controlled
2. **Password migration**: Runs on database init
3. **Startup script**: Ensures password is correct before sync
4. **Proper logic**: Counts files, not items; implements ML gate correctly
5. **Backend integration**: Uses existing database session, no SSH hacks
