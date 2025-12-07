import { Grid, Column, Tile } from '@carbon/react'
import TrainingMetricsChart from '../../components/visualizations/TrainingMetricsChart'
import '../../styles/pages/ExperimentalLog.scss'

const ExperimentalLog = () => {
  return (
    <Grid className="experimental-log" fullWidth>
      <Column lg={16} md={8} sm={4}>
        <h1>Experimental Log</h1>
        <p className="log__description">
          Fine-tuning experiments, model performance, and methodological documentation
        </p>
      </Column>

      <Column lg={16} md={8} sm={4}>
        <Tile className="log__chart-tile">
          <h3>Training Loss Curves</h3>
          <TrainingMetricsChart />
        </Tile>
      </Column>

      <Column lg={16} md={8} sm={4}>
        <Tile>
          <h3>Experiment Log</h3>
          <p className="log__note">
            This section will integrate with Python notebooks to display fine-tuning runs,
            hyperparameters, and qualitative evaluations of the Granite agent's analytical capabilities.
          </p>
        </Tile>
      </Column>
    </Grid>
  )
}

export default ExperimentalLog
