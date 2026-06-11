import { Grid, Column } from '@carbon/react'
import './PageShell.scss'

const joinClassNames = (...values) => values.filter(Boolean).join(' ')

export const PageGrid = ({ children, className = '' }) => {
  return (
    <Grid narrow className={joinClassNames('page-grid', className)}>
      {children}
    </Grid>
  )
}

export const PageColumn = ({
  children,
  className = '',
  lg = 14,
  md = 8,
  sm = 4,
  xlg,
  max,
  ...rest
}) => {
  return (
    <Column
      lg={lg}
      md={md}
      sm={sm}
      xlg={xlg ?? lg}
      max={max ?? lg}
      className={joinClassNames('page-grid__column', className)}
      {...rest}
    >
      {children}
    </Column>
  )
}

export default PageGrid