import React from 'react'
import './../../styles/components/Markdown.scss'

/**
 * Markdown renderer component with Carbon styling
 * Wraps markdown content with proper Carbon-styled classes
 */
const MarkdownRenderer = ({ children, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      {children}
    </div>
  )
}

export default MarkdownRenderer
