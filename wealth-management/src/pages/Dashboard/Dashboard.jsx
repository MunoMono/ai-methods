import { Grid, Column, Heading } from '@carbon/react'
import './Dashboard.scss'

const Dashboard = () => {
  return (
    <div className="dashboard-page">
      <Grid fullWidth>
        <Column lg={16} md={8} sm={4}>
          <div className="page-header">
            <Heading className="page-title">Dashboard</Heading>
          </div>
        </Column>
        
        <Column lg={16} md={8} sm={4}>
          <div className="dashboard-content">
            <p>Welcome to Wealth Management</p>
          </div>
        </Column>
      </Grid>
    </div>
  )
}

export default Dashboard
