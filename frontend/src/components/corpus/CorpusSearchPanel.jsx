import { Button, Select, SelectItem, Tag, TextInput, Tile } from '@carbon/react'

const CorpusSearchPanel = ({ filters, suggestions, onChange, onReset }) => {
  const updateField = (field, value) => {
    onChange((current) => ({
      ...current,
      [field]: value
    }))
  }

  const suggestionGroups = [
    { label: 'Documents', items: suggestions.documents || [] },
    { label: 'Themes', items: suggestions.themes || [] },
    { label: 'Entities', items: suggestions.entities || [] }
  ].filter((group) => group.items.length > 0)

  return (
    <Tile>
      <h3>Search and filter</h3>
      <p style={{ marginBottom: '1rem' }}>
        Use the current document index to narrow the DDR corpus by title text, publication year, and processing state.
      </p>

      <div style={{ display: 'grid', gap: '1rem' }}>
        <TextInput
          id="corpus-keyword"
          labelText="Keyword or document ID"
          placeholder="Search titles, IDs, or known PID text"
          value={filters.keyword}
          onChange={(event) => updateField('keyword', event.target.value)}
        />

        <TextInput
          id="corpus-year"
          labelText="Publication year"
          placeholder="e.g. 1974"
          value={filters.year}
          onChange={(event) => updateField('year', event.target.value.replace(/[^0-9]/g, ''))}
        />

        <Select
          id="corpus-status"
          labelText="Processing status"
          value={filters.status}
          onChange={(event) => updateField('status', event.target.value)}
        >
          <SelectItem text="All statuses" value="" />
          <SelectItem text="Pending" value="pending" />
          <SelectItem text="Completed" value="completed" />
          <SelectItem text="Failed" value="failed" />
        </Select>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button kind="secondary" onClick={onReset}>Reset filters</Button>
        </div>

        <div>
          <h4 style={{ marginBottom: '0.5rem' }}>Autocomplete cues</h4>
          {suggestionGroups.length === 0 ? (
            <p style={{ margin: 0 }}>Start typing two or more characters to see document, theme, and entity suggestions.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {suggestionGroups.map((group) => (
                <div key={group.label}>
                  <div style={{ marginBottom: '0.375rem', fontWeight: 600 }}>{group.label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {group.items.map((item, index) => (
                      <Tag
                        key={`${group.label}-${item.text}-${index}`}
                        type="blue"
                        size="md"
                        onClick={() => updateField('keyword', item.text)}
                      >
                        {item.text}
                      </Tag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 style={{ marginBottom: '0.5rem' }}>Next metadata step</h4>
          <p style={{ margin: 0 }}>
            PID, authority, media, embeddings, and ML coverage filters will become first-class once the list endpoint exposes those fields directly.
          </p>
        </div>
      </div>
    </Tile>
  )
}

export default CorpusSearchPanel