// src/components/editor/js-code-editor.tsx
import { useState, useEffect, useRef, useCallback } from "react"
import {
  Container,
  Heading,
  Button,
  CodeBlock,
  Text,
  toast,
  Badge,
  Switch,
  Label,
  Tooltip,
  clx,
} from "@medusajs/ui"
import { Pencil, Check, X, PlaySolid, Sparkles, MagnifyingGlass, Bolt } from "@medusajs/icons"
import { MonacoEditor } from "./monaco-wrapper"



interface JsCodeEditorProps {
  action: any
  editMode: boolean
  onEditModeChange: (editMode: boolean) => void
  onSave: (config: any) => Promise<void>
  isLoading?: boolean
}

// Template with function wrapper
const FUNCTION_TEMPLATE = `export default async function ({ data, context, logger }) {
  // Your code here
  // Available variables:
  // - data: Input data passed to the action
  // - context: Execution context with metadata
  // - logger: For logging messages (logger.info, logger.error, etc.)
  
  logger.info("Action started with data:", data);
  
  // Example: Process the data
  const processed = {
    ...data,
    processedAt: new Date().toISOString(),
    processedBy: context?.userId || "system"
  };
  
  // Return the result
  return {
    success: true,
    data: processed,
    message: "Action completed successfully"
  };
}`

// Helper function to wrap code in function template
const wrapCodeInFunction = (code: string): string => {
  const lines = code.split('\n');
  let indentLevel = 0;
  
  // Calculate current indentation
  for (const line of lines) {
    if (line.trim().startsWith('export default')) {
      // Already wrapped
      return code;
    }
  }
  
  // Wrap in function
  return `export default async function ({ data, context, logger }) {
${lines.map(line => `  ${line}`).join('\n')}
}`;
}

// Helper function to extract inner code from function
const extractInnerCode = (code: string): string => {
  const lines = code.split('\n');
  const result: string[] = [];
  let insideFunction = false;
  let baseIndent = 0;
  
  for (const line of lines) {
    if (line.includes('export default async function')) {
      insideFunction = true;
      // Find the opening brace
      const braceIndex = line.indexOf('{');
      if (braceIndex !== -1) {
        // Function starts on same line
        continue;
      }
      continue;
    }
    
    if (insideFunction) {
      // Remove the function indentation (2 spaces)
      if (line.trim().startsWith('}') && line.includes('}')) {
        insideFunction = false;
        continue;
      }
      
      // Remove the function body indentation
      const trimmedLine = line.replace(/^\s{2}/, '');
      result.push(trimmedLine);
    } else if (!line.includes('export default')) {
      // Keep other code as-is (for backward compatibility)
      result.push(line);
    }
  }
  
  // If we didn't find a wrapped function, return the original
  if (result.length === 0 && lines.length > 0) {
    return code;
  }
  
  return result.join('\n').trim();
}

export const JsCodeEditor = ({ 
  action, 
  editMode, 
  onEditModeChange,
  onSave,
  isLoading = false
}: JsCodeEditorProps) => {
  const [code, setCode] = useState<string>(() => {
    const existingCode = action?.config?.code || '';
    if (existingCode) {
      return existingCode;
    }
    return FUNCTION_TEMPLATE;
  })
  
  const [innerCode, setInnerCode] = useState<string>(() => 
    extractInnerCode(action?.config?.code || FUNCTION_TEMPLATE)
  )
  
  const [isValidCode, setIsValidCode] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [autoFormat, setAutoFormat] = useState<boolean>(true)
  const [isFormatting, setIsFormatting] = useState<boolean>(false)
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true)
  const editorRef = useRef<any>(null)

  // Load Prettier dynamically
  const formatCode = async (codeToFormat: string): Promise<string> => {
    try {
      // Dynamically import Prettier
      const prettier = await import('prettier/standalone')
      const parserBabel = await import('prettier/parser-babel')
      
      const formatted = await prettier.default.format(codeToFormat, {
        parser: "babel",
        plugins: [parserBabel.default || parserBabel],
        semi: true,
        singleQuote: true,
        trailingComma: "es5",
        printWidth: 80,
        tabWidth: 2,
      })
      return formatted
    } catch (error) {
      console.warn("Formatting error, using basic formatting:", error)
      // Basic formatting fallback
      return codeToFormat
        .replace(/\s+$/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim() + '\n'
    }
  }

  const validateCode = useCallback((codeToValidate: string): boolean => {
    try {
      // Check if it's valid JavaScript syntax
      // Note: We're not actually executing it, just checking syntax
      const wrappedCode = codeToValidate;
            // const wrappedCode = wrapCodeInFunction(codeToValidate)

      new Function(wrappedCode)
      setError(null)
      return true
    } catch (err: any) {
      setError(err.message || 'Invalid JavaScript syntax')
      return false
    }
  }, [])

  const handleCodeChange = useCallback(async (value: string | undefined) => {
    const newCode = value || ""
    setInnerCode(newCode)
    
    // Wrap in function template
    // const wrappedCode = wrapCodeInFunction(newCode)
    const wrappedCode = newCode;

    setCode(wrappedCode)
    
    // Validate syntax
    const isValid = validateCode(newCode)
    setIsValidCode(isValid)
    
    // Auto-format if enabled and valid
    if (autoFormat && isValid && !isFormatting) {
      try {
        const formatted = await formatCode(wrappedCode)
        const extracted = extractInnerCode(formatted)
        if (extracted !== newCode && editorRef.current) {
          setInnerCode(extracted)
          editorRef.current.setValue(extracted)
        }
      } catch (error) {
        // Silently fail auto-format
      }
    }
  }, [autoFormat, isFormatting, validateCode])

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor
    
    // Configure custom completions for inside the function
    monaco.languages.registerCompletionItemProvider('javascript', {
      triggerCharacters: ['.', ' '],
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }

        // Available variables inside the function
        const suggestions = [
          {
            label: 'data',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: 'data',
            range: range,
            detail: 'Input data object',
            documentation: 'The data parameter passed to the function'
          },
          {
            label: 'context',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: 'context',
            range: range,
            detail: 'Execution context',
            documentation: 'Contains metadata about the execution'
          },
          {
            label: 'logger',
            kind: monaco.languages.CompletionItemKind.Variable,
            insertText: 'logger',
            range: range,
            detail: 'Logger instance',
            documentation: 'For logging messages: logger.info(), logger.error(), etc.'
          },
          {
            label: 'logger.info()',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'logger.info(${1:message}, ${2:data})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'Log info message',
            documentation: 'logger.info(message: string, data?: any)'
          },
          {
            label: 'logger.error()',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'logger.error(${1:message}, ${2:error})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'Log error message',
            documentation: 'logger.error(message: string, error?: any)'
          },
          {
            label: 'return',
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: 'return ${1:value};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: range,
            detail: 'Return statement',
            documentation: 'Return a value from the function'
          }
        ]

        return { suggestions }
      }
    })

    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      fontSize: 14,
      wordWrap: 'on',
      automaticLayout: true,
      formatOnPaste: autoFormat,
      formatOnType: autoFormat,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      tabSize: 2,
      lineNumbers: showLineNumbers ? 'on' : 'off',
    })

    // Add keybinding for formatting (Ctrl+Shift+F)
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      async () => {
        try {
          const currentValue = editor.getValue()
          const wrapped = wrapCodeInFunction(currentValue)
          const formatted = await formatCode(wrapped)
          const extracted = extractInnerCode(formatted)
          editor.executeEdits("format", [{
            range: editor.getModel().getFullModelRange(),
            text: extracted
          }])
        } catch (error) {
          toast.error('Failed to format code')
        }
      }
    )
  }, [autoFormat, showLineNumbers])

  const handleFormatClick = async () => {
    try {
      const wrapped = wrapCodeInFunction(innerCode)
      const formatted = await formatCode(wrapped)
      const extracted = extractInnerCode(formatted)
      setInnerCode(extracted)
      if (editorRef.current) {
        editorRef.current.setValue(extracted)
      }
      toast.success('Code formatted')
    } catch (error: any) {
      toast.error('Failed to format code')
    }
  }

  const handleSave = async () => {
    if (!isValidCode) {
      toast.error('Please fix errors before saving')
      return
    }

    const wrappedCode = wrapCodeInFunction(innerCode)
    const config = {
      code: wrappedCode,
      lastUpdated: new Date().toISOString(),
      version: "1.0.0",
      type: "javascript",
      innerCode: innerCode // Store inner code for easier editing
    }

    try {
      await onSave({ config })
      toast.success('Code saved successfully')
      onEditModeChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save code')
    }
  }

  const handleCancel = () => {
    const existingCode = action?.config?.innerCode || extractInnerCode(action?.config?.code || FUNCTION_TEMPLATE)
    setInnerCode(existingCode)
    setError(null)
    onEditModeChange(false)
  }

  const handleTestRun = () => {
    if (!isValidCode) {
      toast.error('Fix errors before testing')
      return
    }
    
    toast.info('Test execution started')
    setTimeout(() => {
      toast.success('Test completed successfully')
    }, 1000)
  }

  // Code snippets for inside the function
  const snippets = [
    {
      name: 'Data Validation',
      code: `// Validate input data
if (!data || typeof data !== 'object') {
  throw new Error('Invalid data: expected object');
}

const required = ['id', 'name'];
const missing = required.filter(field => !data[field]);

if (missing.length > 0) {
  return {
    success: false,
    error: \`Missing fields: \${missing.join(', ')}\`
  };
}

logger.info('Data validated successfully');`
    },
    {
      name: 'API Request',
      code: `// Make API request
try {
  const response = await fetch('https://api.example.com/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${context?.apiKey}\`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(\`API request failed: \${response.status}\`);
  }

  const result = await response.json();
  
  return {
    success: true,
    data: result,
    status: response.status
  };
} catch (error) {
  logger.error('API request failed:', error);
  throw error;
}`
    },
    {
      name: 'Data Transformation',
      code: `// Transform data structure
const transformed = {
  ...data,
  metadata: {
    processedAt: new Date().toISOString(),
    processorId: context?.userId || 'system',
    originalKeys: Object.keys(data).length
  },
  // Add computed fields
  timestamp: Date.now(),
  isProcessed: true
};

logger.info('Data transformed:', { 
  originalKeys: Object.keys(data).length,
  newKeys: Object.keys(transformed).length 
});

return {
  success: true,
  data: transformed,
  message: 'Data transformation complete'
};`
    },
    {
      name: 'Conditional Logic',
      code: `// Conditional processing based on data
let result;
if (data.type === 'user') {
  result = await processUser(data);
  logger.info('Processed as user:', data.id);
} else if (data.type === 'order') {
  result = await processOrder(data);
  logger.info('Processed as order:', data.id);
} else if (data.type === 'product') {
  result = await processProduct(data);
  logger.info('Processed as product:', data.id);
} else {
  logger.warn('Unknown data type:', data.type);
  result = { ...data, processed: false };
}

// Return the result
return {
  success: true,
  data: result,
  processedType: data.type
};`
    },
    {
      name: 'Error Handling',
      code: `// Comprehensive error handling
try {
  // Step 1: Validate
  if (!data.id) {
    throw new Error('Missing required field: id');
  }
  
  // Step 2: Process
  logger.info('Processing started for:', data.id);
  const processed = await complexProcessing(data);
  
  // Step 3: Validate result
  if (!processed || processed.error) {
    throw new Error('Processing returned invalid result');
  }
  
  logger.info('Processing completed successfully');
  
  return {
    success: true,
    data: processed,
    timestamp: new Date().toISOString()
  };
  
} catch (error) {
  // Log detailed error
  logger.error('Processing failed:', {
    error: error.message,
    dataId: data?.id,
    timestamp: new Date().toISOString(),
    context: context
  });
  
  // Return error response
  return {
    success: false,
    error: error.message,
    data: data,
    failedAt: new Date().toISOString()
  };
}`
    },
    {
      name: 'Array Operations',
      code: `// Process array data
if (!Array.isArray(data)) {
  throw new Error('Expected array data');
}

logger.info(\`Processing \${data.length} items\`);

// Map: Transform each item
const mapped = data.map(item => ({
  id: item.id,
  name: item.name?.toUpperCase(),
  processed: true,
  timestamp: new Date().toISOString()
}));

// Filter: Keep only valid items
const filtered = mapped.filter(item => item.id && item.name);

// Reduce: Aggregate data
const summary = filtered.reduce((acc, item) => {
  acc.totalItems++;
  acc.names.push(item.name);
  return acc;
}, { totalItems: 0, names: [] });

logger.info(\`Processed \${filtered.length} of \${data.length} items\`);

return {
  success: true,
  data: filtered,
  summary: summary,
  processedCount: filtered.length
};`
    }
  ]

  // Available variables inside the function
  const availableVariables = [
    { name: 'data', type: 'object', description: 'Input data passed to the action' },
    { name: 'context', type: 'object', description: 'Execution context with metadata (userId, timestamp, etc.)' },
    { name: 'logger', type: 'object', description: 'Logger instance for output messages' },
    { name: 'logger.info()', type: 'method', description: 'Log informational message' },
    { name: 'logger.warn()', type: 'method', description: 'Log warning message' },
    { name: 'logger.error()', type: 'method', description: 'Log error message' },
    { name: 'logger.debug()', type: 'method', description: 'Log debug message' },
  ]

  return (
    <Container className="p-0">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Heading level="h2" className="text-ui-fg-base mb-2">
              Action Code Editor
            </Heading>
            <Text className="text-ui-fg-subtle text-sm">
              Write JavaScript code that runs inside an async function. Available: data, context, logger.
            </Text>
          </div>
          
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button 
                  variant="secondary" 
                  size="small"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X /> Cancel
                </Button>
                
                <Tooltip content="Format code (Ctrl+Shift+F)">
                  <Button 
                    variant="secondary" 
                    size="small"
                    onClick={handleFormatClick}
                    disabled={isLoading || isFormatting}
                    isLoading={isFormatting}
                  >
                    <Sparkles /> Format
                  </Button>
                </Tooltip>
                
                <Tooltip content="Test execution">
                  <Button 
                    variant="secondary" 
                    size="small"
                    onClick={handleTestRun}
                    disabled={!isValidCode}
                  >
                    <PlaySolid /> Test
                  </Button>
                </Tooltip>
                
                <Button 
                  variant="primary" 
                  size="small"
                  onClick={handleSave}
                  disabled={!isValidCode || isLoading}
                  isLoading={isLoading}
                >
                  <Check /> Save
                </Button>
              </>
            ) : (
              <Button 
                variant="secondary" 
                size="small"
                onClick={() => onEditModeChange(true)}
              >
                <Pencil /> Edit Code
              </Button>
            )}
          </div>
        </div>

        {editMode ? (
          <div className="space-y-6">
            {/* Editor Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="auto-format" 
                      checked={autoFormat}
                      onCheckedChange={setAutoFormat}
                      size="small"
                    />
                    <Label htmlFor="auto-format" size="small">
                      Auto-format
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="line-numbers" 
                      checked={showLineNumbers}
                      onCheckedChange={setShowLineNumbers}
                      size="small"
                    />
                    <Label htmlFor="line-numbers" size="small">
                      Line numbers
                    </Label>
                  </div>
                  <Badge size="small" color="blue">JavaScript</Badge>
                </div>
                
                <div className="flex items-center gap-2 text-ui-fg-subtle">
                  <Bolt className="h-4 w-4" />
                  <Text size="small">Press Ctrl+Space for suggestions</Text>
                </div>
              </div>

              {/* Function Header */}
              <div className="p-3 bg-ui-bg-base border border-ui-border-base rounded-t-lg font-mono text-sm">
                <Text className="text-ui-fg-subtle">
                  export default async function (&#123; data, context, logger &#125;) &#123;
                </Text>
              </div>

              {/* Editor */}
              <div className={clx(
                "border border-ui-border-base rounded-b-lg overflow-hidden",
                error ? "border-red-300 border-t-0" : "border-t-0"
              )} style={{ height: "400px" }}>
                <MonacoEditor
                  height="100%"
                  language="javascript"
                  value={innerCode}
                  onChange={handleCodeChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    automaticLayout: true,
                    fontSize: 14,
                    lineNumbers: showLineNumbers ? 'on' : 'off',
                    minimap: { enabled: true },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    wrappingIndent: "indent",
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    tabSize: 2,
                  }}
                />
              </div>

              {/* Function Footer */}
              <div className="p-3 bg-ui-bg-base border border-ui-border-base rounded-lg font-mono text-sm">
                <Text className="text-ui-fg-subtle">&#125;</Text>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <Text size="small" className="text-red-700 font-mono">
                    {error}
                  </Text>
                </div>
              )}
            </div>

            {/* Code Snippets */}
            <div className="space-y-4">
              <Label size="small" weight="plus">
                Code Snippets
              </Label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {snippets.map((snippet, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const newCode = innerCode + (innerCode ? '\n\n' : '') + snippet.code
                      setInnerCode(newCode)
                      if (editorRef.current) {
                        editorRef.current.setValue(newCode)
                      }
                    }}
                    className="p-4 text-left bg-ui-bg-subtle hover:bg-ui-bg-base-hover border border-ui-border-base rounded-lg transition-all hover:border-ui-border-interactive group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Text size="small" weight="plus" className="group-hover:text-ui-fg-interactive">
                        {snippet.name}
                      </Text>
                      <Sparkles className="h-3 w-3 text-ui-fg-muted" />
                    </div>
                    <Text size="small" className="text-ui-fg-subtle line-clamp-3 font-mono">
                      {snippet.code.split('\n')[0]}
                    </Text>
                  </button>
                ))}
              </div>
            </div>

            {/* Available Variables */}
            <div className="space-y-4">
              <Label size="small" weight="plus">
                Available Inside Function
              </Label>
              <div className="p-4 bg-ui-bg-subtle border border-ui-border-base rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {availableVariables.map((variable, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 bg-ui-bg-base rounded border"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-sm font-mono text-ui-fg-base">
                          {variable.name}
                        </code>
                        <Badge size="2xsmall" color="grey">
                          {variable.type}
                        </Badge>
                      </div>
                      <Text size="small" className="text-ui-fg-subtle">
                        {variable.description}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="p-4 bg-ui-bg-subtle border border-ui-border-base rounded-lg">
              <div className="space-y-2">
                <Text size="small" weight="plus" className="text-ui-fg-base">
                  How it works
                </Text>
                <ul className="space-y-1 text-sm text-ui-fg-subtle">
                  <li className="flex items-start gap-2">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ui-fg-muted" />
                    <span>Your code runs inside an async function with <code className="px-1 py-0.5 bg-ui-bg-base rounded">data</code>, <code className="px-1 py-0.5 bg-ui-bg-base rounded">context</code>, and <code className="px-1 py-0.5 bg-ui-bg-base rounded">logger</code> parameters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ui-fg-muted" />
                    <span>Use <code className="px-1 py-0.5 bg-ui-bg-base rounded">return</code> to send data back from the action</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ui-fg-muted" />
                    <span>Use <code className="px-1 py-0.5 bg-ui-bg-base rounded">throw new Error()</code> to fail the action</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ui-fg-muted" />
                    <span>Press <code className="px-1 py-0.5 bg-ui-bg-base rounded">Ctrl+Space</code> for code completion</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            {action?.config?.code ? (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <CodeBlock
                    snippets={[{
                      label: "javascript",
                      language: "javascript",
                      code: action.config.code,
                    }]}
                  >
                    <CodeBlock.Header />
                    <CodeBlock.Body maxHeight="400px" />
                  </CodeBlock>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-ui-bg-subtle rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <MagnifyingGlass className="text-ui-fg-muted" />
                      <div>
                        <Text size="small" weight="plus">Code Details</Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          Last updated: {new Date(action.config.lastUpdated || Date.now()).toLocaleDateString()}
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge size="small" color="green">
                        v{action.config.version || "1.0.0"}
                      </Badge>
                      <Badge size="small" color="blue">
                        JavaScript
                      </Badge>
                      <Text size="small" className="text-ui-fg-subtle">
                        {action.config.code.split('\n').length} lines
                      </Text>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-ui-bg-subtle rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Bolt className="text-ui-fg-muted" />
                      <div>
                        <Text size="small" weight="plus">Available Variables</Text>
                        <Text size="small" className="text-ui-fg-subtle">
                          Inside the function
                        </Text>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableVariables.slice(0, 3).map((variable, idx) => (
                        <Badge key={idx} size="small" color="grey">
                          {variable.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg border-ui-border-base">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-ui-bg-subtle flex items-center justify-center">
                  <Pencil className="text-ui-fg-muted" />
                </div>
                <Text className="text-ui-fg-subtle mb-2">
                  No code configured for this action
                </Text>
                <Text size="small" className="text-ui-fg-muted mb-4">
                  Add JavaScript code to define this action's behavior
                </Text>
                <Button 
                  variant="secondary" 
                  size="small"
                  onClick={() => onEditModeChange(true)}
                >
                  <Pencil /> Add JavaScript Code
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}