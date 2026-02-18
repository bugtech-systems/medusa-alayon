import { useEffect, useState } from "react"
import {
  Button,
  Drawer,
  Heading,
  Input,
  Label,
  Select,
  Textarea,
  Switch,
  toast,
  Hint,
  Badge,
} from "@medusajs/ui"
import {
  useForm,
  Controller,
  FormProvider,
  useFormContext,
  useWatch,
  useFieldArray
} from "react-hook-form"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

import {
  useActions,
  useCreateActionTemplate,
  useUpdateActionTemplate,
} from "../../../hooks/api/actions"

/* ============================================================
   Types
============================================================ */

type ActionType =
  | "DB_OPERATION"
  | "API_CALL"
  | "AI_ACTION"
  | "WORKFLOW"
  | "SCRIPT"

type ActionStatus = "draft" | "active" | "inactive" | "archived"

interface ActionFormData {
  name: string
  description?: string
  handle: string
  type: ActionType
  status: ActionStatus
  config: Record<string, any>
}

interface ActionFormDrawerProps {
  action?: any
  children: React.ReactNode
  isOpen?: boolean
  handleOpen?: (open: boolean) => void
}

interface WorkflowActionsFieldsProps {
  availableActions: {
    id: string
    name: string
    description?: string
  }[]
}

interface WorkflowActionConfig {
  actions: {
    action_id: string
    parameters?: Record<string, any>
  }[]
}

/* ============================================================
   Sortable Item Component
============================================================ */

interface SortableItemProps {
  field: any
  index: number
  availableActions: any[]
  onRemove: (index: number) => void
}

const SortableItem = ({ 
  field, 
  index, 
  availableActions, 
  onRemove 
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const action = availableActions.find(a => a.id === field.action_id)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between border rounded-md px-3 py-2 bg-ui-bg-base hover:bg-ui-bg-subtle transition-colors group"
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-ui-fg-muted hover:text-ui-fg-base"
        >
          <GripVertical size={16} />
        </div>

        {/* Step Number */}
        <Badge size="small" className="min-w-[24px] justify-center">
          {index + 1}
        </Badge>

        {/* Action Name and Description */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{action?.name}</span>
          {action?.description && (
            <span className="text-xs text-ui-fg-muted">
              {action.description}
            </span>
          )}
        </div>
      </div>

      {/* Remove Button */}
      <Button
        size="small"
        variant="transparent"
        className="opacity-0 group-hover:opacity-100 text-ui-fg-muted hover:text-ui-fg-error transition-opacity"
        onClick={() => onRemove(index)}
      >
        Remove
      </Button>
    </div>
  )
}

/* ============================================================
   Workflow Actions Config with Drag & Drop
============================================================ */

export const WorkflowActionsFields = ({
  availableActions,
}: WorkflowActionsFieldsProps) => {
  const { control } = useFormContext<ActionFormData>()

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "config.actions",
  })

  const [isDragging, setIsDragging] = useState(false)

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get selected IDs for disabling already selected actions
  const selectedIds = new Set(fields.map((f) => f.action_id))

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((item) => item.id === active.id)
      const newIndex = fields.findIndex((item) => item.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex)
      }
    }

    setIsDragging(false)
  }

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true)
  }

  // Add new action
  const handleAddAction = (value: string) => {
    if (selectedIds.has(value)) return

    append({ 
      action_id: value,
      // Initialize with default parameters if needed
      parameters: {}
    })
  }

  // Remove action
  const handleRemove = (index: number) => {
    remove(index)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Heading level="h3">Workflow Actions</Heading>
        {fields.length > 0 && (
          <div className="text-sm text-ui-fg-muted">
            {fields.length} action{fields.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Action Picker */}
      <Select onValueChange={handleAddAction}>
        <Select.Trigger>
          <Select.Value placeholder="Add action to workflow" />
        </Select.Trigger>

        <Select.Content>
          {availableActions.map((action) => (
            <Select.Item
              key={action.id}
              value={action.id}
              disabled={selectedIds.has(action.id)}
            >
              <div className="flex flex-col">
                <span>{action.name}</span>
                {action.description && (
                  <span className="text-xs text-ui-fg-muted truncate">
                    {action.description}
                  </span>
                )}
              </div>
            </Select.Item>
          ))}
        </Select.Content>
      </Select>

      {/* Drag and Drop Instructions */}
      {fields.length > 1 && (
        <div className="text-xs text-ui-fg-muted flex items-center gap-2 p-2 bg-ui-bg-subtle rounded-md">
          <GripVertical size={12} />
          Drag and drop to reorder actions
        </div>
      )}

      {/* Selected Actions List with Drag & Drop */}
      {fields.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setIsDragging(false)}
        >
          <SortableContext
            items={fields.map(field => field.id)}
            strategy={verticalListSortingStrategy}
          >
            <div 
              className={`flex flex-col gap-2 transition-opacity ${
                isDragging ? 'opacity-70' : 'opacity-100'
              }`}
            >
              {fields.map((field, index) => (
                <SortableItem
                  key={field.id}
                  field={field}
                  index={index}
                  availableActions={availableActions}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Empty State */}
      {fields.length === 0 && (
        <div className="border border-dashed border-ui-border-base rounded-lg p-8 text-center bg-ui-bg-subtle">
          <div className="text-ui-fg-muted mb-2">
            No actions added yet
          </div>
          <div className="text-xs text-ui-fg-subtle">
            Use the dropdown above to add actions to your workflow
          </div>
        </div>
      )}

      {/* Workflow Sequence Preview */}
      {fields.length > 0 && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">Workflow Sequence</div>
            <div className="text-xs text-ui-fg-muted">
              Click and drag to reorder
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap min-h-[40px]">
            {fields.map((field, index) => {
              const action = availableActions.find(a => a.id === field.action_id)
              return (
                <div key={field.id} className="flex items-center gap-1">
                  <Badge size="small" className="px-2 py-1 bg-ui-bg-component">
                    <span className="text-ui-fg-muted mr-1">{index + 1}.</span>
                    {action?.name}
                  </Badge>
                  {index < fields.length - 1 && (
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16" 
                      fill="none" 
                      className="text-ui-fg-muted"
                    >
                      <path 
                        d="M6 12L10 8L6 4" 
                        stroke="currentColor" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Controlled Select (RHF compatible)
============================================================ */

const ControlledSelect = ({
  name,
  options,
  placeholder,
}: {
  name: string
  placeholder: string
  options: { label: string; value: string }[]
}) => {
  return (
    <Controller
      name={name}
      render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <Select.Trigger>
            <Select.Value placeholder={placeholder} />
          </Select.Trigger>
          <Select.Content>
            {options.map((opt) => (
              <Select.Item key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      )}
    />
  )
}

/* ============================================================
   DB Operation Fields
============================================================ */

const DbOperationFields = () => {
  const { register, control } = useFormContext<ActionFormData>()

  const operation = useWatch({
    control,
    name: "config.operation",
  })

  return (
    <div className="flex flex-col gap-6">
      <Heading level="h3">Database Operation</Heading>

      {/* Table */}
      <div className="flex flex-col gap-2">
        <Label>Table</Label>
        <Input
          {...register("config.table", { required: true })}
          placeholder="users"
        />
      </div>

      {/* Operation */}
      <ControlledSelect
        name="config.operation"
        placeholder="Operation"
        options={[
          { label: "Read", value: "read" },
          { label: "Create", value: "create" },
          { label: "Update", value: "update" },
          { label: "Delete", value: "delete" },
        ]}
      />

      {/* Fields (SELECT / RETURNING) */}
      {(operation === "read" || operation === "create" || operation === "update") && (
        <div className="flex flex-col gap-2">
          <Label>Fields / Returning</Label>
          <Textarea
            rows={3}
            {...register("config.fields")}
            placeholder={`["id", "email", "created_at"]`}
          />
        </div>
      )}

      {/* Data (INSERT / UPDATE) */}
      {(operation === "create" || operation === "update") && (
        <div className="flex flex-col gap-2">
          <Label>Data</Label>
          <Textarea
            rows={4}
            {...register("config.data")}
            placeholder={`{ "email": "{{input.email}}", "active": true }`}
          />
        </div>
      )}

      {/* Where */}
      {(operation === "read" ||
        operation === "update" ||
        operation === "delete") && (
        <div className="flex flex-col gap-2">
          <Label>Where</Label>
          <Textarea
            rows={3}
            {...register("config.where")}
            placeholder={`{ "id": "{{input.user_id}}" }`}
          />
        </div>
      )}

      {/* Ordering */}
      {operation === "read" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Order By</Label>
            <Input
              {...register("config.orderBy")}
              placeholder="created_at DESC"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Limit</Label>
            <Input
              type="number"
              {...register("config.limit", { valueAsNumber: true })}
              placeholder="10"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Offset</Label>
            <Input
              type="number"
              {...register("config.offset", { valueAsNumber: true })}
              placeholder="0"
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Type-specific Config Fields
============================================================ */

const ApiCallFields = () => {
  const { register } = useFormContext<ActionFormData>()

  return (
    <div className="flex flex-col gap-4">
      <Heading level="h3">API Configuration</Heading>

      <div className="flex flex-col gap-2">
        <Label>URL</Label>
        <Input
          {...register("config.url", { required: false })}
          placeholder="https://api.example.com"
        />
      </div>

      <ControlledSelect
        name="config.method"
        placeholder="HTTP Method"
        options={[
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "DELETE", value: "DELETE" },
        ]}
      />

      <div className="flex flex-col gap-2">
        <Label>Request Body (JSON)</Label>
        <Textarea
          {...register("config.body")}
          rows={4}
          placeholder="Request body (JSON)"
        />
      </div>
    </div>
  )
}

const ScriptFields = () => {
  const { register } = useFormContext<ActionFormData>()

  return (
    <div className="flex flex-col gap-4">
      <Heading level="h3">Script</Heading>

      <div className="flex flex-col gap-2">
        <Label>JavaScript Code</Label>
        <Textarea
          {...register("config.code", { required: false })}
          rows={10}
          placeholder={`export default async function ({ data }) {\n  // your code\n}`}
          className="font-mono text-sm"
        />
        <Hint>
          Export a default async function that takes {'{ data }'} as parameter
        </Hint>
      </div>
    </div>
  )
}

const AiFields = () => {
  const { register } = useFormContext<ActionFormData>()

  return (
    <div className="flex flex-col gap-4">
      <Heading level="h3">AI Configuration</Heading>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Model</Label>
          <Input
            {...register("config.model", { required: false })}
            placeholder="gpt-4.1"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Temperature</Label>
          <Input
            type="number"
            step="0.1"
            {...register("config.temperature")}
            placeholder="0.7"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Prompt Template</Label>
        <Textarea
          {...register("config.prompt", { required: false })}
          rows={4}
          placeholder="You are a helpful assistant. Please help with: {{input.query}}"
        />
      </div>
    </div>
  )
}

/* ============================================================
   Main Drawer
============================================================ */

export const ActionFormDrawer = ({
  action,
  children,
  isOpen,
  handleOpen,
}: ActionFormDrawerProps) => {
  const [open, setOpen] = useState(false)
  const [autoHandle, setAutoHandle] = useState(true)
  const { data: actions } = useActions()
  const { mutateAsync: createAction, isPending: isCreating } =
    useCreateActionTemplate()

  const { mutateAsync: updateAction, isPending: isUpdating } =
    useUpdateActionTemplate(action?.id)

  const form = useForm<ActionFormData>({
    defaultValues: {
      name: action?.name ?? "",
      description: action?.description ?? "",
      handle: action?.handle ?? "",
      type: action?.type ?? "API_CALL",
      status: action?.status ?? "draft",
      config: action?.config ?? {},
    },
  })

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    register,
    formState: { errors, dirtyFields, defaultValues },
  } = form

  const name = watch("name")
  const type = watch("type")
  const config = watch("config")

  /* Auto-generate handle */
  useEffect(() => {
    if (autoHandle && name) {
      setValue(
        "handle",
        name
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, "-")
      )
    }
  }, [name, autoHandle, action, setValue])

  useEffect(() => {
    setOpen(isOpen ?? false)
  }, [isOpen])
  
  useEffect(() => {
    if (type !== defaultValues?.type) {
      setValue("config", {})
    } else {
      setValue("config", defaultValues?.config || {})
    }
  }, [type, setValue, autoHandle])

  const onOpenChange = (val: boolean) => {
    setOpen(val)
    handleOpen?.(val)
  }

  const onSubmit = async (data: ActionFormData) => {
    try {
      if (action?.id) {
        await updateAction(data)
        toast.success("Action updated")
      } else {
        await createAction(data)
        toast.success("Action created")
      }
      reset()
      onOpenChange(false)
    } catch(err) {
    console.log(err, 'ERROR')
      toast.error("Failed to save action")
    }
  }

  return (
    <>
      <div onClick={() => onOpenChange(true)}>{children}</div>

      <Drawer open={open} onOpenChange={onOpenChange}>
        <Drawer.Content className="h-[90vh] max-h-[90vh] flex flex-col">
          
          {/* Header (fixed) */}
          <Drawer.Header className="shrink-0 border-b">
            <Drawer.Title>
              {action ? "Edit Action" : "Create Action"}
            </Drawer.Title>
          </Drawer.Header>

          <FormProvider {...form}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col flex-1 min-h-0"
            >
              {/* ============================= */}
              {/* Scrollable Body */}
              {/* ============================= */}
              <Drawer.Body className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
                <div className="flex flex-col gap-6">

                  {/* Name */}
                  <div>
                    <Label>
                      Name <Badge size="small" color="red">Required</Badge>
                    </Label>
                    <Input 
                      {...register("name", { required: true })} 
                      placeholder="e.g., Send Welcome Email"
                    />
                    {errors.name && <Hint variant="error">Required</Hint>}
                  </div>

                  {/* Handle */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Handle</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-ui-fg-muted">Auto-generate</span>
                          <Switch
                            checked={autoHandle}
                            onCheckedChange={setAutoHandle}
                          />
                        </div>
                    </div>
                    <Input
                      {...register("handle", { required: true })}
                      disabled={autoHandle || !!action}
                      placeholder="send-welcome-email"
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-2">
                    <Label>Description</Label>
                    <Textarea
                      {...register("description")}
                      placeholder="Describe what this action does..."
                      rows={3}
                    />
                  </div>

                  {/* Type & Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label>Type</Label>
                      <ControlledSelect
                        name="type"
                        placeholder="Select type"
                        options={[
                          { label: "API Call", value: "API_CALL" },
                          { label: "Database Operation", value: "DB_OPERATION" },
                          { label: "AI Action", value: "AI_ACTION" },
                          { label: "Workflow", value: "WORKFLOW" },
                          { label: "Script", value: "SCRIPT" },
                        ]}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>Status</Label>
                      <ControlledSelect
                        name="status"
                        placeholder="Select status"
                        options={[
                          { label: "Draft", value: "draft" },
                          { label: "Active", value: "active" },
                          { label: "Inactive", value: "inactive" },
                          { label: "Archived", value: "archived" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Dynamic Config */}
                  <div className="border rounded-lg p-4 bg-ui-bg-subtle">
                    <div className="mb-4">
                      <Heading level="h4" className="text-ui-fg-base">
                        Configuration
                      </Heading>
                      <div className="text-xs text-ui-fg-muted">
                        Configure the action based on its type
                      </div>
                    </div>
                    
                    {type === "WORKFLOW" && (
                      <WorkflowActionsFields 
                        availableActions={actions?.actions || []}
                      />
                    )}
                  </div>

                </div>
              </Drawer.Body>

              {/* Footer (fixed) */}
              <Drawer.Footer className="shrink-0 border-t">
                <Drawer.Close asChild>
                  <Button variant="secondary">Cancel</Button>
                </Drawer.Close>
                <Button type="submit" isLoading={isCreating || isUpdating}>
                  {action ? "Update Action" : "Create Action"}
                </Button>
              </Drawer.Footer>
            </form>
          </FormProvider>

        </Drawer.Content>
      </Drawer>
    </>
  )
}