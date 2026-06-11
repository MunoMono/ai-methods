import {
  DataTable,
  Loading,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Tile
} from '@carbon/react'

const headers = [
  { key: 'title', header: 'Title' },
  { key: 'publication_year', header: 'Year' },
  { key: 'processing_status', header: 'Status' },
  { key: 'id', header: 'Document ID' }
]

const statusTagType = {
  completed: 'green',
  pending: 'blue',
  failed: 'red'
}

const DocumentTable = ({ documents, loading, selectedDocumentId, onSelect }) => {
  if (loading) {
    return (
      <Tile>
        <Loading description="Loading corpus documents..." withOverlay={false} />
      </Tile>
    )
  }

  if (documents.length === 0) {
    return (
      <Tile>
        <h3>Corpus documents</h3>
        <p>No indexed DDR documents found. Sync or ingest corpus first.</p>
      </Tile>
    )
  }

  return (
    <Tile>
      <DataTable
        rows={documents.map((document) => ({
          id: document.id,
          title: document.title,
          publication_year: document.publication_year || 'N/A',
          processing_status: document.processing_status
        }))}
        headers={headers}
      >
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <TableContainer title="Corpus documents" description="Select a document to inspect available annotation, PID, and similarity metadata.">
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableHeader key={header.key} {...getHeaderProps({ header })}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    {...getRowProps({ row })}
                    onClick={() => onSelect(documents.find((document) => document.id === row.id))}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: row.id === selectedDocumentId ? 'rgba(15, 98, 254, 0.08)' : undefined
                    }}
                  >
                    {row.cells.map((cell) => (
                      <TableCell key={cell.id}>
                        {cell.info.header === 'processing_status' ? (
                          <Tag type={statusTagType[cell.value] || 'gray'}>{cell.value}</Tag>
                        ) : (
                          cell.value
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </Tile>
  )
}

export default DocumentTable