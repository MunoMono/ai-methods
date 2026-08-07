# Phase 2A Runbook

## Source location

Prepared Turin OCR PDFs are not checked into this repository.

Current confirmed access route:

- Archive GraphQL endpoint: `https://api.ddrarchive.org/graphql`
- Master PDF URLs exposed through `records_v1(status: "published") -> attached_media -> pdf_files(role: "pdf_master")`
- Example source host: `https://archive-media.lon1.digitaloceanspaces.com/...`

## Generate an inventory manifest

```bash
backend/venv/bin/python scripts/generate_corpus_manifest.py \
  --output-csv artifacts/turin-phase2a/manifest.csv \
  --output-json artifacts/turin-phase2a/manifest.json
```

## Materialize a small representative sample and persist document identities

```bash
backend/venv/bin/python scripts/generate_corpus_manifest.py \
  --pid 287080879712 \
  --output-csv artifacts/turin-phase2a/sample-manifest.csv \
  --output-json artifacts/turin-phase2a/sample-manifest.json \
  --download-dir .phase2-samples/materialized \
  --materialize-limit 1 \
  --persist-db
```

This produces a local PDF copy for checksum and page-count validation without mutating the archive master source.

## Known limitations at this checkpoint

- The live archive schema does not expose the older `authority(pid: ...)` or `authorities(...)` query roots assumed by the previous repository code.
- Multiple master PDFs can share a single archive/media PID.
- The repository now treats `source_uri` as the unique source-document locator and no longer relies on PID uniqueness.
- Page-aware and heading-aware chunk persistence is not yet implemented in this checkpoint.
- Docling structure has been verified manually in the backend runtime: `DoclingDocument.pages` is a dict, `num_pages` is available, and export methods include markdown, text, dict, element tree, and document tokens.

## Metadata handling checkpoint

- Live metadata schema snapshot used for Phase 2 mapping: `artifacts/turin-phase2-metadata-schema.json`.
- Role separation is persisted in `documents.authority_data` under `corpus_control`, `retrieval_provenance`, and `catalogue_metadata`.
- Granite context assembly now sends provenance headers plus a separate `ARCHIVE / CATALOGUE METADATA` block when descriptive metadata is present.
- Control metadata such as ML eligibility, page scope, rights, and takedown/access fields remain persisted for pipeline control and provenance, but are withheld from Granite answer context by default.

## Current live inventory snapshot

- `109` master PDFs discovered through the live `records_v1(status: "published")` route.
- `97` ML-eligible assets.
- `12` ML-excluded assets.
- Of the eligible set: `62` unrestricted and `35` page-restricted.

These figures describe the live remote archive inventory discovered through the current GraphQL route. They should not be substituted for local dashboard corpus counts unless the relevant UI endpoint is backed by this same inventory source.