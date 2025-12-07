import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import '../../styles/components/EvidenceGraph.scss'

const EvidenceGraph = ({ data }) => {
  const svgRef = useRef()

  useEffect(() => {
    if (!data) {
      // Render placeholder
      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()
      
      svg.append('text')
        .attr('x', 400)
        .attr('y', 200)
        .attr('text-anchor', 'middle')
        .attr('fill', '#8d8d8d')
        .style('font-size', '16px')
        .text('Submit a query to visualize evidence flow')
      
      return
    }

    // Sample force-directed graph for evidence tracing
    const nodes = [
      { id: 'query', label: 'User Query', group: 1 },
      { id: 'doc1', label: 'Document 1', group: 2 },
      { id: 'doc2', label: 'Document 2', group: 2 },
      { id: 'doc3', label: 'Document 3', group: 2 },
      { id: 'answer', label: 'Agent Response', group: 3 }
    ]

    const links = [
      { source: 'query', target: 'doc1', value: 0.9 },
      { source: 'query', target: 'doc2', value: 0.7 },
      { source: 'query', target: 'doc3', value: 0.5 },
      { source: 'doc1', target: 'answer', value: 0.9 },
      { source: 'doc2', target: 'answer', value: 0.7 }
    ]

    const width = 800
    const height = 400

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#8d8d8d')
      .attr('stroke-width', d => d.value * 3)

    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', 20)
      .attr('fill', d => d.group === 1 ? '#0f62fe' : d.group === 2 ? '#24a148' : '#da1e28')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))

    const labels = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => d.label)
      .attr('font-size', 12)
      .attr('fill', '#f4f4f4')
      .attr('text-anchor', 'middle')
      .attr('dy', 35)

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y)
    })

    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged(event) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

  }, [data])

  return (
    <div className="evidence-graph">
      <svg ref={svgRef}></svg>
    </div>
  )
}

export default EvidenceGraph
