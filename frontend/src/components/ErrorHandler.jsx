'use client'

import React, { useState, useEffect } from 'react'

export default function ErrorHandler({ children }) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState(null)
  const [errorInfo, setErrorInfo] = useState(null)

  useEffect(() => {
    // This will catch errors in the window event
    const handleError = (event) => {
      console.log('Global error caught:', event)
      setHasError(true)
      setError(event.error || new Error('Unknown error occurred'))
      setErrorInfo({ componentStack: 'Check browser console for details' })
      // Prevent the default error handling
      event.preventDefault()
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleError)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleError)
    }
  }, [])

  if (hasError) {
    // You can render any custom fallback UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h2>
          <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <p className="font-medium text-red-800">{error && error.toString()}</p>
          </div>
          {errorInfo && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Component Stack:</h3>
              <pre className="bg-gray-100 p-3 rounded-lg text-sm overflow-auto max-h-48">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
} 