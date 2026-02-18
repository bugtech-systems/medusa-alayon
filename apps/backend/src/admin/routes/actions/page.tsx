import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Bolt, Plus, ChartActivity, Webshipper,  DocumentSeries, Code } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Table,
  Text,
  Toaster,
} from "@medusajs/ui"
import { useActions } from "../../hooks/api/actions"
import { ActionFormDrawer } from "./components/action-form-drawer"
import { ActionActionsMenu } from "./components/action-actions-menu"

const ActionsPage = () => {
  const { data, isLoading, isError } = useActions({
    fields: "id,name,description,handle,type,status,created_at,updated_at",
    limit: 50,
    offset: 0,
  })

  return (
    <>
      <Container className="flex flex-col p-0 overflow-hidden">
        <div className="p-6 flex justify-between items-center">
          <Heading className="font-sans font-medium h1-core">Actions</Heading>
          <ActionFormDrawer>
            <Button variant="secondary" size="small">
              <Plus /> Create Action
            </Button>
          </ActionFormDrawer>
        </div>
        {isLoading && (
          <div className="p-8 text-center">
            <Text>Loading actions...</Text>
          </div>
        )}

        {isError && (
          <div className="p-8 text-center">
            <Text className="text-ui-fg-subtle">
              Error loading actions. Please try again.
            </Text>
          </div>
        )}

        {!isLoading && !isError && (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Last Execution</Table.HeaderCell>
                <Table.HeaderCell>Created</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Header>

                 <Table.Body>
      {data?.actions?.map((template) => (
        <Table.Row
          key={template.id}
          className="cursor-pointer hover:bg-ui-bg-base-hover"
          onClick={() =>
            (window.location.href = `/app/actions/${template.id}`)
          }
        >
          <Table.Cell>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ui-bg-base-component">
                {/* Type-specific icons */}
                {template.type === 'DB_OPERATION' && <DocumentSeries className="text-ui-fg-subtle" />}
                {template.type === 'API_CALL' && <Webshipper className="text-ui-fg-subtle" />}
                {template.type === 'AI_ACTION' && <Bolt className="text-ui-fg-subtle" />}
                {template.type === 'WORKFLOW' && <ChartActivity className="text-ui-fg-subtle" />}
                {template.type === 'SCRIPT' && <Code className="text-ui-fg-subtle" />}
              </div>
              <div>
                <Text className="font-medium">{template.name}</Text>
                <div className="flex items-center gap-2">
                  <Text className="text-ui-fg-subtle font-mono text-xs" size="small">
                    {template.handle}
                  </Text>
                </div>
              </div>
            </div>
          </Table.Cell>
          <Table.Cell>
            <Badge size="small" className="capitalize">
              {template.type}
            </Badge>
          </Table.Cell>
          <Table.Cell>
            <Badge
              size="small"
              color={
                template.status === "active"
                  ? "green"
                  : template.status === "draft"
                  ? "orange"
                  : "grey"
              }
            >
              {template.status}
            </Badge>
          </Table.Cell>
          <Table.Cell>
            {new Date(template.created_at).toLocaleDateString()}
          </Table.Cell>
          <Table.Cell>
            {new Date(template.updated_at).toLocaleDateString()}
          </Table.Cell>
          <Table.Cell onClick={(e) => e.stopPropagation()}>
            <ActionActionsMenu action={template} />
          </Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
          </Table>
        )}

        {data?.actions?.length === 0 && (
          <div className="p-8 text-center">
            <Text className="text-ui-fg-subtle">
              No actions found. Create your first action to get started.
            </Text>
          </div>
        )}
      </Container>
      <Toaster />
    </>
  )
}

export const config = defineRouteConfig({
  label: "Actions",
  icon: Bolt,
})

export default ActionsPage