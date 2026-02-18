import { parseTemplateData } from '../../../../utils/helpers';
import { useState } from "react"
import {
  Container,
  Heading,
  Button,
  CodeBlock,
  Text,
  Textarea,
  toast,
  Badge,
  Switch,
  Label,
} from "@medusajs/ui"
import { Pencil, Check, X } from "@medusajs/icons"
import { useUpdateActionTemplate } from "../../../hooks/api/actions"
import { JsCodeEditor } from "../../../components/editor/js-code-editor"

interface ActionConfigurationFormProps {
  action: any
  editMode: boolean
  onEditModeChange: (editMode: boolean) => void
}

export const ActionConfigurationForm = ({ 
  action, 
  editMode, 
  onEditModeChange 
}: ActionConfigurationFormProps) => {
  const [config, setConfig] = useState(() => 
    JSON.stringify(action.config, null, 2)
  )
  const [isValidJson, setIsValidJson] = useState(true)
  const { mutateAsync: updateAction, isPending } = useUpdateActionTemplate(action.id)

  const handleConfigChange = (value: string) => {
    setConfig(value)
    try {
      JSON.parse(value)
      setIsValidJson(true)
    } catch {
      setIsValidJson(false)
    }
  }

  const handleSave = async () => {
    if (!isValidJson) {
      toast.error('Invalid JSON', {
        description: "Please fix JSON syntax errors",
      })
      return
    }

    try {
      await updateAction({
        config: parseTemplateData(JSON.parse(config))
      })
      toast.success('Success', {
        description: "Configuration updated successfully",
      })
      onEditModeChange(false)
    } catch (error) {
      toast.error('Error', {
        description: "Failed to update configuration",
      })
    }
  }

  const handleCancel = () => {
    setConfig(JSON.stringify(action.config || {}, null, 2))
    onEditModeChange(false)
  }
  


  return (
  <>
    <Container>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Heading level="h3">Configuration</Heading>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button 
                  variant="secondary" 
                  size="small" 
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  <X /> Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="small" 
                  onClick={handleSave}
                  disabled={!isValidJson || isPending}
                >
                  <Check /> Save Changes
                </Button>
              </>
            ) : (
              <Button 
                variant="secondary" 
                size="small" 
                onClick={() => onEditModeChange(true)}
              >
                <Pencil /> Edit Configuration
              </Button>
            )}
          </div>
        </div>

        {editMode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Configuration JSON</Label>
              {!isValidJson && (
                <Badge color="red">Invalid JSON</Badge>
              )}
            </div>
            <Textarea
              value={config}
              onChange={(e) => handleConfigChange(e.target.value)}
              rows={20}
              className="font-mono"
            />
            <div className="text-sm text-ui-fg-subtle">
              Enter a valid JSON object for action configuration
            </div>
          </div>
        ) : (
          <div>
            {action.config ? (
              <CodeBlock
                snippets={[{
                  label: "JSON",
                  language: "json",
                  code: config,
                }]}
              >
                <CodeBlock.Header />
                <CodeBlock.Body />
              </CodeBlock>
            ) : (
              <div className="text-center py-8">
                <Text className="text-ui-fg-subtle">
                  No configuration set for this action
                </Text>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>

    </>
  )
}