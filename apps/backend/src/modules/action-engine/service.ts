// src/modules/action-engine/service.ts
import { 
  generateEntityId,
  MedusaService,
} from "@medusajs/framework/utils"
import { 
  InferTypeOf, 
  DAL,
  Logger
} from "@medusajs/framework/types"
import { ActionTemplate, Execution, ActionExecution } from "./models"
import * as expressionEvaluator from "./expressionEvaluator"
import axios from "axios"
import { Worker } from "worker_threads"
import path from "path"
import { chatCompletion, generateCompletion, generateEmbedding, streamChatCompletion } from "../../utils/ollama"
import { DatabaseOperationService } from "./services/database-action-service"
import { ActionConfig, Condition, ExecutionStatus, HealthCheckResult, QueryBuilderResult, QueryConfig, StandardResponse, WhereCondition } from "./types"
import { parseActionInput, validateActionInput } from "@/utils/validators"



// Define types
type ActionTemplateType = InferTypeOf<typeof ActionTemplate>
type ExecutionType = InferTypeOf<typeof Execution>
type ActionExecutionType = InferTypeOf<typeof ActionExecution>



// ========== PUBLIC TYPE DECLARATIONS ==========

export interface ActionEngineServiceTypes {
  // Entity types
  ActionTemplate: ActionTemplateType
  Execution: ExecutionType
  ActionExecution: ActionExecutionType
  
  // Method return types
  execute: ReturnType<ActionEngineService['execute']>
  getExecutionStatus: ReturnType<ActionEngineService['getExecutionStatus']>
  executeWorkflowWithDependencies: ReturnType<ActionEngineService['executeWorkflowWithDependencies']>
  healthCheck: ReturnType<ActionEngineService['healthCheck']>
  // Repository methods (inherited from MedusaService)
  retrieveActionTemplate: ReturnType<ActionEngineService['retrieveActionTemplate']>
  listActionTemplates: ReturnType<ActionEngineService['listActionTemplates']>
  createActionTemplate: ReturnType<ActionEngineService['createActionTemplates']>
  updateActionTemplate: ReturnType<ActionEngineService['updateActionTemplates']>
  deleteActionTemplate: ReturnType<ActionEngineService['deleteActionTemplates']>
  retrieveExecution: ReturnType<ActionEngineService['retrieveExecution']>
  listExecutions: ReturnType<ActionEngineService['listExecutions']>
  createExecutions: ReturnType<ActionEngineService['createExecutions']>
  updateExecutions: ReturnType<ActionEngineService['updateExecutions']>
  deleteExecution: ReturnType<ActionEngineService['deleteExecutions']>
  retrieveActionExecution: ReturnType<ActionEngineService['retrieveActionExecution']>
  listActionExecutions: ReturnType<ActionEngineService['listActionExecutions']>
  createActionExecutions: ReturnType<ActionEngineService['createActionExecutions']>
  updateActionExecutions: ReturnType<ActionEngineService['updateActionExecutions']>
  deleteActionExecution: ReturnType<ActionEngineService['deleteActionExecutions']>
}


// ========== SERVICE CLASS ==========

export default class ActionEngineService extends MedusaService({
  ActionExecution,
  Execution,
  ActionTemplate
}) {
  // Medusa services
  private readonly logger_: Logger
  
  // Loader-registered resources
  private postgresPool?: any
  private customEventBus?: any
  private dbService: DatabaseOperationService

  // Execution context
  private executionId: string | null = null
  private executionContext = {
    previousOutputs: new Map<string, any>(),
    globalVariables: new Map<string, any>(),
    executionData: {} as Record<string, any>
  }

  constructor(
    container: any,
    options?: any
  ) {
    super(container)
    
    // Get logger from Medusa container
    this.logger_ = container.logger
    this.dbService = new DatabaseOperationService(container.postgresPool, container.logger)
    // Get loader-registered services (use optional chaining)
    this.postgresPool = container.postgresPool
    this.customEventBus = container.eventBus // Custom event bus from loader
    
    this.logger_.info("✅ ActionEngineService initialized")
  }

  // ========== CORE ACTION ENGINE METHODS ==========

  /**
   * Main execution method
   */
  async execute(
    templateId: string, 
    parameters: Record<string, any> = {}, 
    session: SessionContext = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now()
    // this.executionId = this.generateExecutionId()
    
    try {
      // Get template using Medusa repository
      const template = await this.retrieveActionTemplate(templateId) as any;
      if (!template) {
        throw new Error(`Action template ${templateId} not found`)
      }

      // Create execution record
      const execution = await this.createExecutions({
        workflow_id: template.id,
        status: 'running',
        started_at: new Date(),
        input_data: parameters,
        metadata: {
          templateId,
          templateName: template.name,
          sessionId: session.session_id
        }
      })

      // Build context
      const context = {
        context: {},
        params: parameters,
        outputs: {}
      }


    this.executionId = execution.id


      // Emit execution started event
      await this.emitEvent('executionStarted', {
        executionId: this.executionId,
        templateId,
        startedAt: new Date()
      })

let result;
      
    if(template.type == 'WORKFLOW'){
     result = await this.executeWorkflow(template?.config, context);
    } else {
     let execResult = await this.executeAction(template, context);
     result = { data: execResult }
    }
    


      // let result = await this.executeAction(template, context)


      // Update execution record
      await this.updateExecutions({
        id: this.executionId, 
        status: 'completed',
        completed_at: new Date(),
        duration_ms: Date.now() - startTime,
        output_data: result
      })

      // Emit completion event
      await this.emitEvent('executionCompleted', {
        executionId: this.executionId,
        duration: Date.now() - startTime,
        success: true
      })

      return {
        success: true,
        status: 'success',
        status_code: 200,
        executionId: this.executionId,
        execution_time: Date.now() - startTime,
        ...result,
      }

    } catch (error: any) {
      await this.handleExecutionError(error, startTime)
      throw error
    }
  }

  /**
   * Emit events through available channels
   */
  private async emitEvent(eventType: string, data: any): Promise<void> {
    // 1. Use custom event bus from loader
    if (this.customEventBus) {
      try {
        this.customEventBus.emit(eventType, data)
        this.logger_.debug(`Event emitted via custom event bus: ${eventType}`)
      } catch (error) {
        this.logger_.warn(`Failed to emit via custom event bus: ${error}`)
      }
    }
    
    // 3. Log as fallback
    this.logger_.info(`Event: ${eventType}`)
  }


  /**
   * Execute individual action
   */
  private async executeAction(template: ActionTemplateType, context: any): Promise<any> {
    // Check conditions
    
    
    
    
    
    
    
    
    
    if (template.conditions) {
      const resolvedConditions = await expressionEvaluator.resolvePlaceholders(
        template.conditions,
        context
      )
      if (!this.evaluateConditions(resolvedConditions, context)) {
        return { status: "skipped", reason: "conditions_not_met" }
      }
    }

    // Resolve configuration
    const config = await expressionEvaluator.resolvePlaceholders(
      template.config,
      context
    )


   console.log(config, context, 'EXECUTION CONTEXT')

    // Execute based on type
    switch (template.type) {
      case 'DB_OPERATION':
        return await this.executeDatabaseOperation(config)
      case 'API_CALL':
        return await this.callAPI(config, context)
      case 'AI_ACTION':
        return await this.callAI(config, context)
      case 'WORKFLOW':
        return await this.executeWorkflow(template.config, context)
      case 'SCRIPT':
        return await this.executeScript(config, context)
      default:
        return { success: false, status: 'error', message: `Unsupported action type: ${template.type}`}
    }
  }





  // Main refined database operation function
private async executeDatabaseOperation(config: any): Promise<any> {

let queryConfig = {limit: 10, ...config}
  if (!this.postgresPool) {
                    return { success: false, status: 'error', message: "Database pool not available. Check your postgres-loader."}

  }


  const client = await this.postgresPool.connect()
  
  try {
    
    let queryResult: QueryBuilderResult
    let result: any
    
    switch (queryConfig.operation) {
      case 'read':
        queryResult = this.buildSelectQuery(queryConfig)
        
        
        const selectResult = await client.query(queryResult.sql, queryResult.params)
        console.log(selectResult, selectResult.rows, queryConfig, 'DB REAAD')
        return selectResult.rows
        
      case 'create':
        if (Array.isArray(queryConfig.data)) {
          return await this.executeBatchCreate(queryConfig, client)
        }
        queryResult = this.buildInsertQuery(queryConfig)
        
        const insertResult = await client.query(queryResult.sql, queryResult.params)
        return queryConfig.returning ? insertResult.rows[0] : { success: true, id: insertResult.rows[0]?.id }
        
      case 'update':
        queryResult = this.buildUpdateQuery(queryConfig)
        const updateResult = await client.query(queryResult.sql, queryResult.params)
        return queryConfig.returning ? updateResult.rows[0] : { success: true, affectedRows: updateResult.rowCount }
        
      case 'delete':
        queryResult = this.buildDeleteQuery(queryConfig)
        const deleteResult = await client.query(queryResult.sql, queryResult.params)
        return { success: true, affectedRows: deleteResult.rowCount }
        
      case 'upsert':
        queryResult = this.buildUpsertQuery(queryConfig)
        const upsertResult = await client.query(queryResult.sql, queryResult.params)
        return queryConfig.returning ? upsertResult.rows[0] : { success: true }
        
      case 'count':
        queryResult = this.buildCountQuery(queryConfig)
        const countResult = await client.query(queryResult.sql, queryResult.params)
        return { count: parseInt(countResult.rows[0].count) }
        
      case 'exists':
        queryResult = this.buildExistsQuery(queryConfig)
        const existsResult = await client.query(queryResult.sql, queryResult.params)
        return { exists: existsResult.rows[0].exists }
        
      case 'batch_create':
        return await this.executeBatchCreate(queryConfig, client)
        
      default:
        return { success: false, status: 'error', message: `Unsupported database operation: ${queryConfig.operation}`}
        // throw new Error(`Unsupported database operation: ${queryConfig.operation}`)
    }
   } catch(err) {
    return { success: false, status: 'error', message: `Something went wrong - database operation: ${queryConfig.operation}`}
   } finally {
    client.release()
  }
}


// ========== QUERY BUILDERS ==========

private buildSelectQuery(config: QueryConfig): QueryBuilderResult {
  const params: any[] = []
  let paramIndex = 1
  
  // SELECT clause
  const fields = config.fields === '*' || !config.fields 
    ? '*' 
    : config.fields.map(f => this.quoteReservedKeywords(f)).join(', ')
  
  let sql = `SELECT ${fields} FROM ${this.quoteReservedKeywords(config.table)}`
  
  // WHERE clause
  if (config.where) {
    const whereResult = this.buildWhereClause(config.where, paramIndex)
    sql += ` WHERE ${whereResult.clause}`
    params.push(...whereResult.params)
    paramIndex += whereResult.params.length
  }
  
  // ORDER BY clause
  if (config.orderBy) {
    const orderByClause = Object.entries(config.orderBy)
      .map(([field, direction]) => `${this.quoteReservedKeywords(field)} ${direction.toUpperCase()}`)
      .join(', ')
    sql += ` ORDER BY ${orderByClause}`
  }
  
  // LIMIT and OFFSET
  if ((config.limit !== undefined && config.limit != null)) {
    sql += ` LIMIT $${paramIndex}`
    params.push(config.limit || 10)
    paramIndex++
  }
  
  if (config.offset !== undefined && config.offset != null) {
    sql += ` OFFSET $${paramIndex}`
    params.push(config.offset || 0)
    paramIndex++
  }
  
  // RETURNING clause (PostgreSQL specific)
  if (config.returning) {
    const returning = config.returning === '*' 
      ? '*' 
      : config.returning.map(f => this.quoteReservedKeywords(f)).join(', ')
    sql += ` RETURNING ${returning}`
  }
  
  return { sql, params }
}

private buildInsertQuery(config: QueryConfig): QueryBuilderResult {
  const params: any[] = []
  const data = this.sanitizeData(config.data as Record<string, any>)
  
  // Generate ID if not provided
  if (!data.id) {
    data.id = generateEntityId("", config.table.toLowerCase())
  }
  
  const columns = Object.keys(data).map(col => this.quoteReservedKeywords(col))
  const values = Object.values(data)
  const placeholders = values.map((_, i) => `$${i + 1}`)
  
  let sql = `INSERT INTO ${this.quoteReservedKeywords(config.table)} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`
  
  // ON CONFLICT clause (for upsert-like behavior)
  if (config.onConflict) {
    const target = config.onConflict.target.map(col => this.quoteReservedKeywords(col)).join(', ')
    sql += ` ON CONFLICT (${target})`
    
    if (config.onConflict.update && config.onConflict.update.length > 0) {
      const updates = config.onConflict.update.map(col => 
        `${this.quoteReservedKeywords(col)} = EXCLUDED.${this.quoteReservedKeywords(col)}`
      ).join(', ')
      sql += ` DO UPDATE SET ${updates}`
      
      if (config.onConflict.where) {
        const whereResult = this.buildWhereClause(config.onConflict.where, values.length + 1)
        sql += ` WHERE ${whereResult.clause}`
        params.push(...whereResult.params)
      }
    } else {
      sql += ` DO NOTHING`
    }
  }
  
  // RETURNING clause
  if (config.returning) {
    const returning = config.returning === '*' 
      ? '*' 
      : config.returning.map(f => this.quoteReservedKeywords(f)).join(', ')
    sql += ` RETURNING ${returning}`
  } else {
    sql += ` RETURNING *`
  }
  
  return { sql, params: values.concat(params) }
}

private buildUpdateQuery(config: QueryConfig): QueryBuilderResult {
  const params: any[] = []
  let paramIndex = 1
  
  const data = this.sanitizeData(config.data as Record<string, any>)
  delete data.id // Remove ID from update data
  
  const setClause = Object.keys(data)
    .map((key, i) => `${this.quoteReservedKeywords(key)} = $${paramIndex + i}`)
    .join(', ')
  
  params.push(...Object.values(data))
  paramIndex += Object.keys(data).length
  
  let sql = `UPDATE ${this.quoteReservedKeywords(config.table)} SET ${setClause}`
  
  // WHERE clause
  if (config.where) {
    const whereResult = this.buildWhereClause(config.where, paramIndex)
    sql += ` WHERE ${whereResult.clause}`
    params.push(...whereResult.params)
    paramIndex += whereResult.params.length
  }
  
  // RETURNING clause
  if (config.returning) {
    const returning = config.returning === '*' 
      ? '*' 
      : config.returning.map(f => this.quoteReservedKeywords(f)).join(', ')
    sql += ` RETURNING ${returning}`
  }
  
  return { sql, params }
}

private buildDeleteQuery(config: QueryConfig): QueryBuilderResult {
  const params: any[] = []
  let paramIndex = 1
  
  let sql = `DELETE FROM ${this.quoteReservedKeywords(config.table)}`
  
  // WHERE clause
  if (config.where) {
    const whereResult = this.buildWhereClause(config.where, paramIndex)
    sql += ` WHERE ${whereResult.clause}`
    params.push(...whereResult.params)
  }
  
  // RETURNING clause
  if (config.returning) {
    const returning = config.returning === '*' 
      ? '*' 
      : config.returning.map(f => this.quoteReservedKeywords(f)).join(', ')
    sql += ` RETURNING ${returning}`
  }
  
  return { sql, params }
}

private buildUpsertQuery(config: QueryConfig): QueryBuilderResult {
  // For PostgreSQL, use INSERT ... ON CONFLICT
  const insertConfig = {
    ...config,
    onConflict: config.onConflict || { 
      target: ['id'],
      update: Object.keys(config.data as Record<string, any>).filter(k => k !== 'id')
    }
  }
  return this.buildInsertQuery(insertConfig)
}

private buildCountQuery(config: QueryConfig): QueryBuilderResult {
  const params: any[] = []
  let paramIndex = 1
  
  let sql = `SELECT COUNT(*) as count FROM ${this.quoteReservedKeywords(config.table)}`
  
  // WHERE clause
  if (config.where) {
    const whereResult = this.buildWhereClause(config.where, paramIndex)
    sql += ` WHERE ${whereResult.clause}`
    params.push(...whereResult.params)
  }
  
  return { sql, params }
}

private buildExistsQuery(config: QueryConfig): QueryBuilderResult {
  const params: any[] = []
  let paramIndex = 1
  
  let sql = `SELECT EXISTS(SELECT 1 FROM ${this.quoteReservedKeywords(config.table)}`
  
  // WHERE clause
  if (config.where) {
    const whereResult = this.buildWhereClause(config.where, paramIndex)
    sql += ` WHERE ${whereResult.clause}`
    params.push(...whereResult.params)
  }
  
  sql += `) as exists`
  
  return { sql, params }
}

// ========== WHERE CLAUSE BUILDER ==========

private buildWhereClause(
  where: Record<string, any> | WhereCondition[], 
  startParamIndex: number = 1
): { clause: string; params: any[] } {
  const params: any[] = []
  let paramIndex = startParamIndex
  
  if (Array.isArray(where)) {
    // Handle array of WhereCondition objects
    const conditions = where.map(cond => {
      if (cond.conditions) {
        // Nested conditions
        const nested = this.buildWhereClause(cond.conditions, paramIndex)
        paramIndex += nested.params.length
        params.push(...nested.params)
        return `(${nested.clause})`
      } else {
        // Single condition
        const result = this.buildSingleCondition(cond, paramIndex)
        paramIndex += result.params.length
        params.push(...result.params)
        return result.clause
      }
    })
    
    return {
      clause: conditions.join(' AND '),
      params
    }
  } else {
    // Handle simple object format { field: value }
    const conditions = Object.entries(where).map(([field, value]) => {
      let operator = '='
      let paramValue = value
      
      // Handle special operators from field name
      if (field.endsWith('__neq')) {
        operator = '!='
        field = field.replace('__neq', '')
      } else if (field.endsWith('__gt')) {
        operator = '>'
        field = field.replace('__gt', '')
      } else if (field.endsWith('__gte')) {
        operator = '>='
        field = field.replace('__gte', '')
      } else if (field.endsWith('__lt')) {
        operator = '<'
        field = field.replace('__lt', '')
      } else if (field.endsWith('__lte')) {
        operator = '<='
        field = field.replace('__lte', '')
      } else if (field.endsWith('__like')) {
        operator = 'LIKE'
        field = field.replace('__like', '')
        paramValue = `%${value}%`
      } else if (field.endsWith('__ilike')) {
        operator = 'ILIKE'
        field = field.replace('__ilike', '')
        paramValue = `%${value}%`
      } else if (field.endsWith('__in')) {
        operator = 'IN'
        field = field.replace('__in', '')
        paramValue = Array.isArray(value) ? value : [value]
      } else if (field.endsWith('__not_in')) {
        operator = 'NOT IN'
        field = field.replace('__not_in', '')
        paramValue = Array.isArray(value) ? value : [value]
      } else if (field.endsWith('__is_null')) {
        operator = 'IS NULL'
        field = field.replace('__is_null', '')
        paramValue = undefined
      } else if (field.endsWith('__is_not_null')) {
        operator = 'IS NOT NULL'
        field = field.replace('__is_not_null', '')
        paramValue = undefined
      }
      
      const clause = paramValue === undefined
        ? `${this.quoteReservedKeywords(field)} ${operator}`
        : operator === 'IN' || operator === 'NOT IN'
        ? `${this.quoteReservedKeywords(field)} ${operator} (${Array.isArray(paramValue) 
            ? paramValue.map((_, i) => `$${paramIndex + i}`).join(', ')
            : `$${paramIndex}`
          })`
        : `${this.quoteReservedKeywords(field)} ${operator} $${paramIndex}`
      
      const conditionParams = paramValue === undefined 
        ? [] 
        : Array.isArray(paramValue) 
          ? paramValue 
          : [paramValue]
      
      paramIndex += conditionParams.length
      params.push(...conditionParams)
      
      return clause
    })
    
    return {
      clause: conditions.join(' AND '),
      params
    }
  }
}

private buildSingleCondition(condition: WhereCondition, paramIndex: number): { clause: string; params: any[] } {
  const { field, operator, value, logical = 'AND' } = condition
  const quotedField = this.quoteReservedKeywords(field)
  
  let clause = ''
  let params: any[] = []
  
  switch (operator) {
    case 'eq':
      clause = `${quotedField} = $${paramIndex}`
      params = [value]
      break
    case 'neq':
      clause = `${quotedField} != $${paramIndex}`
      params = [value]
      break
    case 'gt':
      clause = `${quotedField} > $${paramIndex}`
      params = [value]
      break
    case 'gte':
      clause = `${quotedField} >= $${paramIndex}`
      params = [value]
      break
    case 'lt':
      clause = `${quotedField} < $${paramIndex}`
      params = [value]
      break
    case 'lte':
      clause = `${quotedField} <= $${paramIndex}`
      params = [value]
      break
    case 'like':
      clause = `${quotedField} LIKE $${paramIndex}`
      params = [`%${value}%`]
      break
    case 'ilike':
      clause = `${quotedField} ILIKE $${paramIndex}`
      params = [`%${value}%`]
      break
    case 'in':
      if (!Array.isArray(value)) {
        throw new Error('IN operator requires an array value')
      }
      const inPlaceholders = value.map((_, i) => `$${paramIndex + i}`).join(', ')
      clause = `${quotedField} IN (${inPlaceholders})`
      params = [...value]
      break
    case 'not_in':
      if (!Array.isArray(value)) {
        throw new Error('NOT IN operator requires an array value')
      }
      const notInPlaceholders = value.map((_, i) => `$${paramIndex + i}`).join(', ')
      clause = `${quotedField} NOT IN (${notInPlaceholders})`
      params = [...value]
      break
    case 'is_null':
      clause = `${quotedField} IS NULL`
      params = []
      break
    case 'is_not_null':
      clause = `${quotedField} IS NOT NULL`
      params = []
      break
    case 'between':
      if (!Array.isArray(value) || value.length !== 2) {
        throw new Error('BETWEEN operator requires an array of two values')
      }
      clause = `${quotedField} BETWEEN $${paramIndex} AND $${paramIndex + 1}`
      params = [value[0], value[1]]
      break
    default:
      throw new Error(`Unsupported operator: ${operator}`)
  }
  
  return { clause, params }
}

// ========== HELPER METHODS ==========

private async executeBatchCreate(config: QueryConfig, client: any): Promise<any> {
  if (!Array.isArray(config.data) || config.data.length === 0) {
    throw new Error('batch_create operation requires an array of data')
  }
  
  const results = [] as any;
  
  for (const item of config.data) {
    const itemConfig = {
      ...config,
      data: item,
      operation: 'create' as const
    }
    
    const queryResult = this.buildInsertQuery(itemConfig)
    const result = await client.query(queryResult.sql, queryResult.params)
    results.push(result.rows[0])
  }
  
  return results
}

private sanitizeData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue // Skip undefined/null values
    }
    
    // Handle dates
    if (value instanceof Date) {
      sanitized[key] = value.toISOString()
    }
    // Handle JSON objects/arrays
    else if (typeof value === 'object' && !(value instanceof Buffer)) {
      sanitized[key] = JSON.stringify(value)
    }
    // Handle other types
    else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}


// Utility method to handle reserved keywords
private quoteReservedKeywords(sql: any): string {
  const reservedKeywords = [
    'order', 'user', 'group', 'select', 'insert', 'update', 'delete',
    'table', 'where', 'from', 'to', 'as', 'on', 'by', 'with', 'like',
    'between', 'in', 'is', 'null', 'not', 'and', 'or', 'case', 'when',
    'then', 'else', 'end', 'exists', 'all', 'any', 'some', 'distinct',
    'limit', 'offset', 'fetch', 'for', 'if', 'primary', 'key', 'foreign',
    'references', 'constraint', 'check', 'default', 'index', 'view',
    'sequence', 'trigger', 'procedure', 'function', 'grant', 'revoke'
  ]
  
  // Replace table names that are reserved keywords
  reservedKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
    if(sql){
    sql = sql.replace(regex, `"${keyword}"`)
    }
  })
  
  return sql
}
  /**
   * API call handler
   */
  private async callAPI(config: ActionConfig, context: any): Promise<any> {
    const { method, url, headers, body, timeout = 30000 } = config
    
    try {
      const response = await axios({
        method: method || "GET",
        url: url,
        data: body,
        headers,
        timeout
      })
      
      return response.data
    } catch (error: any) {
      this.logger_.error(`API call failed: ${url}`, error)
        return this.buildErrorResponse(error, 500, `API call failed: ${error.message}`)
    }
  }

  /**
   * AI call handler
   */
  private async callAI(config: ActionConfig, context: any): Promise<any> {
    this.logger_.info(`Executing AI action ${config.model}`)
    
    try {
    
    
    console.log(config, 'AI CONFIGG')
    
    let result = await generateCompletion({prompt: config.message || config.prompt, ...config})
    
    console.log(result, 'AI RESUULT')
    
    // Implement your AI service integration here
    // return { 
    //   result: result.response,
    //   success: true, 
    //   model: config.model,
    //   timestamp: new Date().toISOString(),
    // }
          return  result.response

   } catch(err) {
      return { success: false, status_code: 400, status: 'error', message: 'Chat AI Action Error:', err }
    }
  }

  /**
   * Script execution handler
   */
private async executeScript(config: any, context: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      path.resolve(__dirname, "services", "script-worker.js"),
      {
        workerData: {
          code: config.code,
          params: context,
          callStack: [context.executionId || "root"]
        }
      }
    );

    worker.on("message", (msg) => {
      if (msg.error) return reject(new Error(msg.error));
      resolve(msg.result);
    });

    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}


  /**
   * Workflow execution handler
   */
   private async executeWorkflow(config: any, context: any): Promise<any> {
    this.logger_.info(`Executing workflow ${config}`);
    
    let success = true;
    let payload;
    let variables = {}
    let oldParams = {...context.params};
    let finalResult;
    let handle;
    let errors;
    const actions = config.actions || [];
    const workflowResults: Record<string, any> = {};
    
    for (const actionConfig of actions) {
      const action = await this.getActionTemplate(actionConfig.action_id);
      // console.log(workflowResults, action, actionConfig, 'ACTTT')
      if (!action) continue;
      
      let params = actionConfig.parameters;
      
      // if(action.parameters){
      // action.parameters.map(param => {
      //     let value = null as any
          
      //     if(!params[param.name]) {
      //       if(param.defaultValue){
      //         value = param.defaultValue
      //       } else {
      //         return            
      //       }
      //     };
          
      //     if(param.type == 'json'){
      //       value = JSON.parse(params[param.name]);
      //     } else if(param.type == 'number'){
      //       value = Number(params[param.name]);
      //     } else {
      //       value = params[param.name]
      //     }
      
      //     validatedParameters[param.name] = value
      // })      
      // }
      
            
          if(action.parameters){
           payload  = parseActionInput(action.parameters || [], oldParams)
          }
          
          
   

      
      
      // Merge parameters
      const mergedParams = {
        ...oldParams,
        ...(await expressionEvaluator.resolvePlaceholders(
          params || {}, 
          {...context, ...oldParams, context: variables, outputs: workflowResults }
        ))
      };
      

          
      /* 
          if(action.parameters && action.parameters.length){
            errors = validateActionInput(action.parameters || [], mergedParams)
          } */
          
          
        // if (errors.length > 0) {
        //   console.log("Validation failed:", errors)
        //             break;

        // } 
      

      
      console.log(mergedParams, payload, action, actionConfig, 'paraams')
      
      // Execute action
      const result = await this.executeAction({...action, ...actionConfig}, {
        context: variables,
        params: mergedParams,
        outputs: workflowResults
      });
      
      let outputKey = action.output_as ? action.output_as : (action.handle || action.id);
      let output = result;
      

      if(actionConfig.context_template){
        let contextOutput = (await expressionEvaluator.resolvePlaceholders(
          actionConfig.context_template, 
          {...context, ...oldParams, context: variables, outputs: workflowResults, result }
        ))        
          variables = {...variables, ...contextOutput};
      }

      
      if(actionConfig.output_template){
        let templatedOutput = (await expressionEvaluator.resolvePlaceholders(
          actionConfig.output_template, 
          {...context, ...oldParams, context: variables, outputs: workflowResults, result }
        ))
          output = templatedOutput;
      }
      
      
      
      workflowResults[outputKey] = {parameters: mergedParams, context: variables, result: output};
      
      // Store result
      
      finalResult = output;
      success = result.success;
      oldParams = {...oldParams, ...mergedParams}
      handle = action.name;
      // Check if we should exit the workflow
      if (result.exit || result.status === 'error') {
        
        break;
      }
    }
    
    return {
      success,
      status_code: success ? 200 : 400,
      data: finalResult,
      handle,
      ...(errors ? errors : {}),
      outputs: workflowResults,
      context: variables,
      completedActions: Object.keys(workflowResults).length
    };
  }

   
  // private async executeWorkflow(config: any, context: any): Promise<any> {
  //   this.logger_.info(`Executing workflow ${config}`)
    
  //   // Extract workflow actions
  //   const actions = config.actions || [] as any
  //   const results = new Map<string, any>()
  //   const logs = [] as any;
    
    
  //   for (const actionConfig of actions) {
  //     const action = await this.retrieveActionTemplate(actionConfig.action_id)
  //     if (!action) continue
      
  //     // Merge parameters
  //     const mergedParams = {
  //       ...context.params,
  //       ...(await expressionEvaluator.resolvePlaceholders(actionConfig.parameters || {}, {...context, outputs: Object.fromEntries(results)}))
  //     }
      
      
  

  //     // Execute action
  //     const result = await this.executeAction(action, {
  //       ...context,
  //       params: mergedParams,
  //       outputs: Object.fromEntries(results)
  //     })
      
  //     logs.push({handle: action?.handle, ...result})
  //     results.set(action?.handle || action?.id, {result, ...{
  //       ...context,
  //       params: mergedParams,
  //       outputs: Object.fromEntries(results)
  //     }})
        
  //   }
    
  //   return { success: true, results: Object.fromEntries(results)}
    
  // }
  
  

  // ========== HELPER METHODS ==========

  /**
   * Evaluate conditions
   */
  private evaluateConditions(conditions: Condition, context: any): boolean {
    if (!conditions || typeof conditions !== "object") return true
    
    if (conditions.and) {
      return conditions.and.every((c: Condition) => this.evaluateConditions(c, context))
    }
    
    if (conditions.or) {
      return conditions.or.some((c: Condition) => this.evaluateConditions(c, context))
    }

    if (conditions.field && conditions.operator) {
      const fieldValue = expressionEvaluator.getNestedValue(context, conditions.field)
      const compareValue = conditions.value

      switch (conditions.operator) {
        case "eq": return fieldValue == compareValue
        case "neq": return fieldValue != compareValue
        case "gt": return fieldValue > compareValue
        case "gte": return fieldValue >= compareValue
        case "lt": return fieldValue < compareValue
        case "lte": return fieldValue <= compareValue
        case "in": return Array.isArray(compareValue) && compareValue.includes(fieldValue)
        case "like": return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase())
        case "exists": return fieldValue !== undefined && fieldValue !== null
        case "not_exists": return fieldValue === undefined || fieldValue === null
        default: return false
      }
    }
    
    return true
  }

  /**
   * Handle execution errors
   */
  private async handleExecutionError(error: any, startTime: number): Promise<void> {
    if (this.executionId) {
      await this.updateExecutions({
        id: this.executionId,
        status: 'failed',
        completed_at: new Date(),
        duration_ms: Date.now() - startTime,
        error_message: error.message
      })
      
      await this.emitEvent('executionFailed', {
        executionId: this.executionId,
        error: error.message,
        duration: Date.now() - startTime
      })
    }
    
    this.logger_.error("Action execution failed:", error)
  }


  // ========== PUBLIC API METHODS ==========

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<ExecutionStatus | any> {
    const execution = await this.retrieveExecution(executionId)
    
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`)
    }

    // Get action executions
    const actionExecutions = await this.listActionExecutions({
      execution_id: { $eq: executionId }
    })

    return {
      ...execution,
      actions: actionExecutions,
      progress: execution.status === 'running' 
        ? actionExecutions.filter(a => a.status === 'completed').length / actionExecutions.length
        : 1
    }
  }
  
  async getActionTemplate(actionId: string): Promise<any> {
    
        let template = await this.listActionTemplates({  $or: [
        {
          id: {
            $eq: actionId,
          },
        },
        {
          handle: {
            $eq: actionId,
          },
        },
      ]})
    
    if(!template.length){
      return null
    }

    return template[0]
  }

  /**
   * Execute workflow with dependencies
   */
  async executeWorkflowWithDependencies(
    workflowId: string,
    parameters: Record<string, any> = {},
    session: SessionContext = {}
  ): Promise<WorkflowResult> {
    // Get all actions for this workflow
    const actions = await this.listActionTemplates({
      workflow_id: { $eq: workflowId }
    })

    if (!actions.length) {
      throw new Error(`No actions found for workflow ${workflowId}`)
    }

    // Sort by dependencies
    const sortedActions = this.sortActionsByDependencies(actions)
    
    // Execute in order
    const results = new Map<string, any>()
    
    for (const action of sortedActions) {
      // Check dependencies
      if (!this.checkDependencies(action, results)) {
        await this.createActionExecutions({
          action_id: action.id,
          execution_id: this.executionId!,
          status: 'skipped',
          error_message: 'Dependencies not satisfied'
        })
        continue
      }

      // Execute action
      const result = await this.executeAction(action, {
        ...session,
        params: parameters,
        previousOutputs: Object.fromEntries(results)
      })
      
      results.set(action.id, result)
    }

    return {
      workflowId,
      results: Object.fromEntries(results),
      executionId: this.executionId!
    }
  }

  /**
   * Sort actions by dependencies
   */
  private sortActionsByDependencies(actions: ActionTemplateType[]): ActionTemplateType[] {
    const graph = new Map<string, string[]>()
    const indegree = new Map<string, number>()
    const actionMap = new Map<string, ActionTemplateType>()

    // Initialize
    actions.forEach(action => {
      graph.set(action.id, [])
      indegree.set(action.id, 0)
      actionMap.set(action.id, action)
    })

    // Build graph
    actions.forEach(action => {
      if (action.dependencies && Array.isArray(action.dependencies)) {
        action.dependencies.forEach(depId => {
          if (graph.has(depId)) {
            graph.get(depId)!.push(action.id)
            indegree.set(action.id, indegree.get(action.id)! + 1)
          }
        })
      }
    })

    // Topological sort
    const queue = Array.from(indegree.entries())
      .filter(([_, degree]) => degree === 0)
      .map(([id]) => id)

    const sorted: ActionTemplateType[] = []

    while (queue.length > 0) {
      const currentId = queue.shift()!
      sorted.push(actionMap.get(currentId)!)

      graph.get(currentId)?.forEach(neighborId => {
        indegree.set(neighborId, indegree.get(neighborId)! - 1)
        if (indegree.get(neighborId) === 0) {
          queue.push(neighborId)
        }
      })
    }

    return sorted
  }

  /**
   * Check if action dependencies are satisfied
   */
  private checkDependencies(action: ActionTemplateType, results: Map<string, any>): boolean {
    if (!action.dependencies || !Array.isArray(action.dependencies)) {
      return true
    }

    return action.dependencies.every(depId => {
      const result = results.get(depId)
      return result && !result.error
    })
  }
  
    private buildStandardResponse(
      data: any,
      exitOnError: boolean = false,
      metadata?: any
    ): StandardResponse {
      const isError = data?.success === false || data instanceof Error
      
      return {
        success: !isError,
        code: isError ? (data.code || 500) : 200,
        message: isError ? data.message : "Action completed successfully",
        data: isError ? null : data,
        exit: isError && exitOnError,
        metadata: {
          timestamp: new Date().toISOString(),
          ...metadata
        }
      }
    }
  
    private buildSuccessResponse(
      data: any,
      message: string = "Success",
      additionalData?: any
    ): StandardResponse {
      return {
        success: true,
        code: 200,
        message,
        data: data,
        exit: false,
        metadata: { timestamp: new Date().toISOString(), ...additionalData }
      }
    }
  
    private buildErrorResponse(
      error: Error | any,
      status_code: number = 400,
      message?: string
    ): StandardResponse {
      return {
        success: false,
        status_code,
        error,
        status: 'error',
        message: message || error.message || "Unknown error",
        data: null,
        exit: true,
        metadata: {
          timestamp: new Date().toISOString(),
          errorType: error.constructor?.name
        }
      }
    }
  

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const services = {
      logger: !!this.logger_,
      postgresPool: !!this.postgresPool,
      customEventBus: !!this.customEventBus
    }
    
    return {
      healthy: Object.values(services).every(Boolean),
      services,
      timestamp: new Date().toISOString()
    }
  }
}




































// ========== TYPE UTILITIES ==========

/**
 * Utility type to extract service method signatures
 */
// export type ActionEngineServiceMethods = Pick<
//   ActionEngineService,
//   | 'execute'
//   | 'getExecutionStatus'
//   | 'executeWorkflowWithDependencies'
//   | 'healthCheck'
//   | 'retrieveActionTemplate'
//   | 'listActionTemplates'
//   | 'createActionTemplates'
//   | 'updateActionTemplate'
//   | 'deleteActionTemplate'
//   | 'retrieveExecution'
//   | 'listExecutions'
//   | 'createExecutions'
//   | 'updateExecutions'
//   | 'deleteExecution'
//   | 'retrieveActionExecution'
//   | 'listActionExecutions'
//   | 'createActionExecutions'
//   | 'updateActionExecutions'
//   | 'deleteActionExecution'
// >

/**
 * Type for API route handlers using the service
 */
 
 
 
export type ActionEngineApiContext = {
  actionEngineService: ActionEngineService
}

// Export all types for use in API routes
export * as ActionEngineTypes from './types'