#!/usr/bin/env python3
"""
Fetch PIDs from DDR Archive GraphQL and sync to droplet database
"""
import requests
import json

GRAPHQL_ENDPOINT = "https://api.ddrarchive.org/graphql"

# Query for parent authority records with attached media
query = """
{
  records_v1(status: "published") {
    id
    pid
    title
    status
    level
    reference_code
    scope_and_content
    date_begin
    date_end
    
    # DDR metadata
    ddr_period
    project_theme
    methodology
    epistemic_stance
    
    # Project details
    project_title
    project_job_number
    project_start_date
    project_end_date
    
    # Rights
    copyright_holder
    rights_holders
    
    # All attached media for this parent
    attached_media {
      id
      pid
      title
      caption
      attachment_role
      attachment_sequence
      
      # Image files
      jpg_derivatives {
        role
        url
        signed_url
        filename
        label
      }
      
      # PDF files
      pdf_files {
        role
        url
        signed_url
        filename
        label
      }
      
      # ML fields
      digital_assets {
        use_for_ml
        ml_annotation
      }
    }
  }
}
"""

def fetch_records():
    """Fetch parent records from DDR Archive GraphQL"""
    print("🔍 Fetching records from DDR Archive GraphQL...")
    print(f"📡 Endpoint: {GRAPHQL_ENDPOINT}\n")
    
    try:
        response = requests.post(
            GRAPHQL_ENDPOINT,
            json={'query': query},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        # Save response
        with open('/tmp/records_v1_response.json', 'w') as f:
            json.dump(data, f, indent=2)
        print(f"💾 Response saved to /tmp/records_v1_response.json\n")
        
        return data
        
    except Exception as e:
        print(f"❌ GraphQL request failed: {e}")
        return None

def analyze_records(data):
    """Analyze the records and return parent PIDs"""
    if not data or 'data' not in data:
        print("❌ No data in response")
        if data and 'errors' in data:
            print(f"GraphQL Errors: {data['errors']}")
        return []
    
    records = data['data'].get('records_v1', [])
    print(f"📊 Total parent records: {len(records)}\n")
    
    parent_pids = []
    
    for record in records:
        pid = record.get('pid')
        title = record.get('title', 'Untitled')
        attached_media = record.get('attached_media', [])
        
        # Count media by type
        pdf_count = sum(1 for m in attached_media if m.get('pdf_files'))
        jpg_count = sum(1 for m in attached_media if m.get('jpg_derivatives'))
        
        # Collect child PIDs
        child_pids = [m.get('pid') for m in attached_media if m.get('pid')]
        
        print(f"📄 PID: {pid}")
        print(f"   Title: {title}")
        print(f"   Attached Media: {len(attached_media)} items")
        print(f"   - PDFs: {pdf_count}")
        print(f"   - JPGs: {jpg_count}")
        if child_pids:
            print(f"   - Child PIDs: {child_pids}")
        print()
        
        if pid:
            parent_pids.append(pid)
    
    return parent_pids

def insert_pids_to_droplet(parent_pids):
    """Insert parent PIDs to droplet database"""
    print(f"\n📝 Inserting {len(parent_pids)} parent PIDs to droplet database...")
    
    for pid in parent_pids:
        # Create a document record with this PID
        # For now, just insert the PID - the sync service can enrich later
        insert_sql = f"""
        INSERT INTO documents (document_id, title, publication_year, filename, pid)
        VALUES (
            'doc_pid_{pid}',
            'Authority Record {pid}',
            1970,
            '{pid}.pdf',
            '{pid}'
        )
        ON CONFLICT (pid) DO NOTHING;
        """
        
        cmd = f'ssh root@104.248.170.26 "docker exec epistemic-drift-db psql -U postgres -d epistemic_drift -c \\"{insert_sql}\\""'
        print(f"  Inserting PID: {pid}")
        import subprocess
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"    ⚠️  Error: {result.stderr}")
        else:
            print(f"    ✅ Inserted")
    
    print("\n✅ Done!")

if __name__ == "__main__":
    # Fetch records
    data = fetch_records()
    
    if data:
        # Analyze and get parent PIDs
        parent_pids = analyze_records(data)
        
        if parent_pids:
            print(f"\n🎯 Found {len(parent_pids)} parent PIDs to sync")
            
            # Insert to droplet
            insert_pids_to_droplet(parent_pids)
            
            # Verify
            print("\n🔍 Verifying database...")
            import subprocess
            result = subprocess.run(
                'ssh root@104.248.170.26 "docker exec epistemic-drift-db psql -U postgres -d epistemic_drift -c \'SELECT COUNT(DISTINCT pid) FROM documents WHERE pid IS NOT NULL;\'"',
                shell=True,
                capture_output=True,
                text=True
            )
            print(result.stdout)
        else:
            print("❌ No parent PIDs found")
