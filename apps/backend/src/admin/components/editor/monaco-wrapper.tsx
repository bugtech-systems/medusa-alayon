import dynamic from 'next/dynamic'
import { Loader } from "@medusajs/icons"

// Simple Monaco environment setup
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.MonacoEnvironment = {
    getWorkerUrl: function (_moduleId: string, label: string) {
      // Using CDN approach for simplicity
      const getWorker = (label: string) => {
        const base = 'https://unpkg.com/monaco-editor@latest/min/vs'
        const workers: Record<string, string> = {
          editor: `${base}/editor/editor.worker.js`,
          json: `${base}/language/json/json.worker.js`,
          css: `${base}/language/css/css.worker.js`,
          html: `${base}/language/html/html.worker.js`,
          typescript: `${base}/language/typescript/ts.worker.js`,
          javascript: `${base}/language/typescript/ts.worker.js`
        }
        return workers[label] || workers.editor
      }
      
      return getWorker(label)
    }
  }
}

// Dynamically import Monaco Editor
export const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(mod => {
    // Configure Monaco loader to use CDN
    if (typeof window !== 'undefined') {
      // @ts-ignore
      const loader = window.require || window.monacoLoader
      if (loader) {
        loader.config({ 
          paths: { 
            vs: 'https://unpkg.com/monaco-editor@latest/min/vs' 
          } 
        })
      }
    }
    return mod.default
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-ui-bg-subtle rounded">
        <Loader className="text-ui-fg-subtle" />
      </div>
    )
  }
)