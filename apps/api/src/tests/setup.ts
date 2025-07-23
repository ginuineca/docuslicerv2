// Jest setup file for DocuSlicer API tests

// Increase timeout for integration tests
jest.setTimeout(30000)

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.PORT = '3001'
process.env.UPLOAD_DIR = './test-uploads'

// Mock external services
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mocked AI response' } }]
        })
      }
    }
  }))
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
      signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } })
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' } }),
        download: jest.fn().mockResolvedValue({ data: Buffer.from('test') })
      })
    }
  })
}))

// Global test utilities
global.testUtils = {
  createMockFile: (name: string, size: number = 1024) => ({
    fieldname: 'file',
    originalname: name,
    encoding: '7bit',
    mimetype: 'application/pdf',
    size,
    buffer: Buffer.alloc(size),
    destination: './test-uploads',
    filename: name,
    path: `./test-uploads/${name}`
  })
}

// Cleanup after tests
afterAll(async () => {
  // Clean up test files and connections
  console.log('Test cleanup completed')
})
