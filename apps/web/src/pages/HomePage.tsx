import { Link } from 'react-router-dom'
import { FileText, Zap, Shield, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components'

export function HomePage() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Logo />
            <nav className="flex space-x-8">
              {user ? (
                <>
                  <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                    Dashboard
                  </Link>
                  <span className="text-gray-600">Welcome, {user.email}</span>
                </>
              ) : (
                <>
                  <Link to="/signin" className="text-gray-600 hover:text-gray-900">
                    Sign In
                  </Link>
                  <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Automate Your PDF
            <span className="text-blue-600"> Workflows</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Transform, process, and manage your PDF documents with intelligent automation. 
            From simple conversions to complex workflow orchestration.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              to={user ? "/dashboard" : "/signup"}
              className="bg-blue-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-blue-700 flex items-center"
            >
              {user ? "Go to Dashboard" : "Get Started"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <button className="border border-gray-300 text-gray-700 px-8 py-3 rounded-md text-lg font-medium hover:bg-gray-50">
              Learn More
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">PDF Processing</h3>
            <p className="text-gray-600">
              Extract, convert, merge, and split PDFs with advanced processing capabilities.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Workflow Automation</h3>
            <p className="text-gray-600">
              Create custom workflows to automate repetitive document processing tasks.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
            <p className="text-gray-600">
              Enterprise-grade security with reliable processing and data protection.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
