// Simple test to verify workflow service
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// Simple workflow endpoint
app.get('/api/workflow/workflows', (req, res) => {
  console.log('📋 GET /api/workflow/workflows called')
  res.json({
    success: true,
    workflows: [],
    count: 0
  })
})

app.get('/api/workflow/health', (req, res) => {
  console.log('🏥 GET /api/workflow/health called')
  res.json({
    success: true,
    service: 'Workflow Service',
    status: 'healthy'
  })
})

app.get('/health', (req, res) => {
  console.log('🏥 GET /health called')
  res.json({
    success: true,
    service: 'API Server',
    status: 'healthy'
  })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`✅ Test API server running on http://localhost:${PORT}`)
  console.log('📋 Available endpoints:')
  console.log('  - GET /health')
  console.log('  - GET /api/workflow/health')
  console.log('  - GET /api/workflow/workflows')
})
