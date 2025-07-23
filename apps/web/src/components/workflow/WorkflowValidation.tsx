import React from 'react'
import { AlertTriangle, CheckCircle, Info, Lightbulb, X } from 'lucide-react'
import { ValidationResult, ValidationError, ValidationWarning, ValidationSuggestion } from '../../utils/workflowValidator'

interface WorkflowValidationProps {
  validation: ValidationResult
  onClose?: () => void
  onApplySuggestion?: (suggestion: ValidationSuggestion) => void
}

export function WorkflowValidation({ 
  validation, 
  onClose, 
  onApplySuggestion 
}: WorkflowValidationProps) {
  const { isValid, errors, warnings, suggestions } = validation

  const errorCount = errors.filter(e => e.severity === 'error').length
  const warningCount = warnings.length
  const suggestionCount = suggestions.length

  if (errorCount === 0 && warningCount === 0 && suggestionCount === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-green-800 font-medium">Workflow is valid and ready to run!</span>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className={`border rounded-lg p-4 ${
        errorCount > 0 
          ? 'bg-red-50 border-red-200' 
          : warningCount > 0 
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {errorCount > 0 ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : warningCount > 0 ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : (
              <Info className="h-5 w-5 text-blue-500" />
            )}
            <span className={`font-medium ${
              errorCount > 0 
                ? 'text-red-800' 
                : warningCount > 0 
                  ? 'text-yellow-800'
                  : 'text-blue-800'
            }`}>
              Workflow Validation Results
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="mt-2 flex items-center space-x-4 text-sm">
          {errorCount > 0 && (
            <span className="text-red-700">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-yellow-700">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
          {suggestionCount > 0 && (
            <span className="text-blue-700">
              {suggestionCount} suggestion{suggestionCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Errors */}
      {errorCount > 0 && (
        <div className="bg-white border border-red-200 rounded-lg">
          <div className="px-4 py-3 border-b border-red-200 bg-red-50">
            <h3 className="font-medium text-red-800 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Errors ({errorCount})
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {errors.filter(e => e.severity === 'error').map((error, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {getErrorTypeLabel(error.type)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {error.message}
                  </div>
                  {error.nodeId !== 'workflow' && (
                    <div className="text-xs text-gray-500 mt-1">
                      Node: {error.nodeId}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warningCount > 0 && (
        <div className="bg-white border border-yellow-200 rounded-lg">
          <div className="px-4 py-3 border-b border-yellow-200 bg-yellow-50">
            <h3 className="font-medium text-yellow-800 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Warnings ({warningCount})
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {getWarningTypeLabel(warning.type)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {warning.message}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Node: {warning.nodeId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestionCount > 0 && (
        <div className="bg-white border border-blue-200 rounded-lg">
          <div className="px-4 py-3 border-b border-blue-200 bg-blue-50">
            <h3 className="font-medium text-blue-800 flex items-center">
              <Lightbulb className="h-4 w-4 mr-2" />
              Suggestions ({suggestionCount})
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {getSuggestionTypeLabel(suggestion.type)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {suggestion.message}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Node: {suggestion.nodeId}
                  </div>
                  {suggestion.action && onApplySuggestion && (
                    <button
                      onClick={() => onApplySuggestion(suggestion)}
                      className="mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                    >
                      Apply Suggestion
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getErrorTypeLabel(type: ValidationError['type']): string {
  switch (type) {
    case 'format-incompatible': return 'Format Incompatibility'
    case 'missing-conversion': return 'Missing Conversion'
    case 'invalid-operation': return 'Invalid Operation'
    case 'circular-dependency': return 'Circular Dependency'
    default: return 'Unknown Error'
  }
}

function getWarningTypeLabel(type: ValidationWarning['type']): string {
  switch (type) {
    case 'format-suboptimal': return 'Suboptimal Format'
    case 'performance-impact': return 'Performance Impact'
    case 'quality-loss': return 'Potential Quality Loss'
    default: return 'Unknown Warning'
  }
}

function getSuggestionTypeLabel(type: ValidationSuggestion['type']): string {
  switch (type) {
    case 'add-conversion': return 'Add Conversion Node'
    case 'reorder-nodes': return 'Reorder Nodes'
    case 'optimize-format': return 'Optimize Format'
    default: return 'Unknown Suggestion'
  }
}
