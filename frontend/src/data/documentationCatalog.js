export const DOCUMENTATION_ENTRIES = [
  {
    id: 'DOC-001',
    slug: 'expanded-abstract',
    title: 'Expanded abstract',
    fullTitle: 'Testamentary traces of contested design knowledge: mobilising the Royal College of Art\'s Department of Design Research archive',
    summary: 'Expanded abstract for the DDR archive thesis, outlining the historical, archival, and computational strands of the research instrument.',
    author: 'Graham Newman',
    status: 'Working draft',
    classification: 'PhD documentation',
    sourceFormat: 'Word (.docx)',
    wordCount: 988,
    sourcePath: '/docs/expanded_abstract.docx',
    publishedLabel: 'Seeded from /docs',
    tags: ['Expanded abstract', 'DDR archive', 'Practice-led research', 'Documentation'],
    researchQuestions: [
      {
        label: 'Primary research question',
        text: 'How might testamentary traces of contested design knowledge be mobilised to activate the RCA\'s DDR archive?',
      },
      {
        label: 'Secondary research question',
        text: 'How might revisiting the ideas current in the DDR period inform contemporary design and design research knowledge?',
      },
    ],
    sections: [
      {
        id: 'overview',
        heading: 'Overview',
        paragraphs: [
          'Between 1965 and 1985, the Royal College of Art\'s Department of Design Research was central to the formation of British design research. Under Bruce Archer, the department brought together researchers including Kenneth Agnew, George Mallen, Gillian Patterson, Ken Baynes and Richard Langdon to test what design research might be, where it might operate, and what knowledge it could produce.',
          'Forty years later, that contribution remains visible but difficult to study as a coherent field. The archival materials are dispersed across Royal College of Art Special Collections and the DDR archive at V&A East Storehouse. They are partial, unevenly described and inconsistently accessible. This condition is the thesis\'s starting point and the ground of its contribution to knowledge.',
          'The practice-led thesis begins from the problem that the DDR archive\'s existence does not yet make it a coherent research resource. Documents, recollections, catalogue descriptions and absences survive in relation to one another and must be reconstructed across partial records, institutional memory and uneven systems of description.',
        ],
      },
      {
        id: 'testamentary-traces',
        heading: 'Testamentary traces',
        paragraphs: [
          'By testamentary traces, the project means the documentary, descriptive, remembered and absent traces through which DDR research culture can be interpreted. By mobilised, it means bringing dispersed material into forms that make it legible, connected and usable for interpretation in the present.',
          'The archive is treated both as historical evidence and as a methodological site: a domain where design knowledge was recorded, organised and obscured under particular institutional conditions. The thesis addresses this through three strands: historical emergence, archival mediation and computational reactivation.',
        ],
      },
      {
        id: 'strand-one',
        heading: 'Strand one: historical emergence',
        paragraphs: [
          'Strand one reconstructs how contested design knowledge took shape through debate, institutional experiment and project outcome. Archer\'s writing on systematic method, design education and design research provides a central line of inquiry, alongside later formulations by Nigel Cross and Christopher Frayling.',
          'The analysis also attends to the distributed work of DDR researchers and collaborators, complicating a founder-led account of the department. Patterson\'s work on hospital bed design, Baynes and Langdon\'s role in design education, Mallen\'s work on computing, and the collections of Agnew and Wood point to a research culture in which design knowledge was practical, institutional and social.',
          'Feminist and situated critiques, particularly Cheryl Buckley on design historiography and Lucy Suchman on located accountability and invisible labour, sharpen this line of inquiry by asking whose labour becomes recognised and preserved. Strand one establishes the historical unevenness the archive inherits.',
        ],
      },
      {
        id: 'strand-two',
        heading: 'Strand two: archival mediation',
        paragraphs: [
          'Strand two uses archival investigation and oral history to work with fragmentary material. It asks how description, classification, provenance, catalogue structure, omission and missingness shape what can be found, connected and treated as historically significant.',
          'Tom Nesmith, Luciana Duranti, David Bearman, Geoffrey Bowker and Susan Leigh Star, Joan Schwartz and Terry Cook frame archives as systems that actively structure evidence. Oral history from DDR staff and students works through a different evidential logic, framed through Alessandro Portelli and Alistair Thomson.',
          'Testimony is treated as retrospective meaning-making shaped by memory, narration and present concerns. This matters because DDR evidence survives as documents, catalogue structures, absences, memories and later interpretations.',
        ],
      },
      {
        id: 'strand-three',
        heading: 'Strand three: computational reactivation',
        paragraphs: [
          'Strand three develops the computational and practice-led work. It asks how computational methods might surface, model and re-read DDR archival traces while remaining accountable to provenance. Devon Mordell provides the critical frame for treating archives as datafication rather than neutral digitisation.',
          'Mark Hedges, Richard Marciano and Eirini Goudarouli locate this work within computational archival science, where extraction, modelling and access remain tied to archival context. Johanna Drucker shapes the approach to visualisation by treating data as interpretive capta, while Stephen Boyd Davis, Olivia Vane and Florian Krautli frame questions of trust, omission and uncertainty in humanities visualisation.',
          'The thesis develops an open-access archive platform and API through which DDR records are searched, linked and visualised. Retrieval-augmented archival interrogation, embedding-based visual analytics, dimensional reduction, clustering and anomaly-proximity detection propose relations, identify patterns and make absences inspectable.',
        ],
      },
      {
        id: 'contribution',
        heading: 'Contribution to knowledge',
        paragraphs: [
          'The contribution to knowledge lies in sewing these strands together as a designed research apparatus for archival activation, combining retrieval-augmented archival interrogation, oral-historical interpretation, embedding-based visual analytics and a corroborative checking layer. The novelty is the conduit between source, absence, pattern, testimony and interpretation.',
          'Retrieval creates traceable paths through the archive. Missingness becomes an archival and interpretive condition. Oral history tests and complicates the documentary record. Visual analytics provides an interpretive space in which relations, clusters and anomalies can be examined. Corroborative checking helps distinguish what can be claimed, what must be qualified and what remains unresolved.',
          'Methodologically, the thesis offers a reusable workflow for partial, under-described and access-constrained archives: source-linked retrieval, missingness analysis, oral-historical cross-reading, visual analytics and claim-evidence checking. The DDR archive is the specific case, while the method has wider significance for design research, archival studies, digital humanities, GLAM practice, responsible AI and computational approaches to cultural heritage.',
        ],
      },
    ],
  },
]

export const getDocumentationEntry = (slug) => DOCUMENTATION_ENTRIES.find((entry) => entry.slug === slug) ?? null