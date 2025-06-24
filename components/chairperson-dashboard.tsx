import type React from "react"
import { Box, Typography, Paper } from "@mui/material"
import ChairpersonReviewWorkflow from "./ChairpersonReviewWorkflow"

const ChairpersonDashboard: React.FC = () => {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Chairperson Dashboard
      </Typography>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Instructions
        </Typography>
        <Typography variant="body1">
          Welcome to the Chairperson Dashboard. Your primary responsibility is to review applications submitted to you
          and either forward them to the next stage or reject them. Please carefully evaluate each application before
          making a decision.
        </Typography>
      </Paper>

      <ChairpersonReviewWorkflow />
    </Box>
  )
}

export default ChairpersonDashboard
