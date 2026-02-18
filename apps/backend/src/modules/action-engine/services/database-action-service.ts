// src/modules/action-engine/services/database-operation.service.ts
import { Logger } from "@medusajs/framework/types"
import { Pool, QueryResult, PoolClient } from "pg"
import { generateEntityId } from "@medusajs/framework/utils"

// ========== TYPES ==========

export interface QueryConfig {
  operation: 'read' | 'create' | 'update' | 'delete' | 'upsert' | 'count' | 'exists' | 'batch_create'
  table: string
  data?: Record<string, any> | Record<string, any>[]
  fields?: string[] | '*'
  where?: Record<string, any> | WhereCondition[]
  orderBy?: Record<string, 'asc' | 'desc'>
  limit?: number
  offset?: number
  returning?: string[] | '*'
  onConflict?: {
    target: string[]
    update?: string[]
    where?: Record<string, any>
  }
  distinct?: boolean
  groupBy?: string[]
  having?: Record<string, any> | WhereCondition[]
}

export interface WhereCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'not_in' | 'is_null' | 'is_not_null' | 'between' | 'contains' | 'contained_by' | 'overlaps'
  value?: any
  logical?: 'AND' | 'OR'
  conditions?: WhereCondition[]
}

export interface QueryBuilderResult {
  sql: string
  params: any[]
}

export interface DatabaseOperationResult {
  success: boolean
  data?: any
  count?: number
  affectedRows?: number
  error?: string
  query?: string
  duration?: number
  metadata?: {
    operation: string
    table: string
    timestamp: string
  }
}

export interface TransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE'
  readOnly?: boolean
  deferrable?: boolean
}

// ========== SERVICE ==========

export class DatabaseOperationService {
  private pool: Pool
  private logger: Logger
  private reservedKeywords = new Set([
    'order', 'user', 'group', 'select', 'insert', 'update', 'delete',
    'table', 'where', 'from', 'to', 'as', 'on', 'by', 'with', 'like',
    'between', 'in', 'is', 'null', 'not', 'and', 'or', 'case', 'when',
    'then', 'else', 'end', 'exists', 'all', 'any', 'some', 'distinct',
    'limit', 'offset', 'fetch', 'for', 'if', 'primary', 'key', 'foreign',
    'references', 'constraint', 'check', 'default', 'index', 'view',
    'sequence', 'trigger', 'procedure', 'function', 'grant', 'revoke'
  ])

  constructor(pool: Pool, logger: Logger) {
    this.pool = pool
    this.logger = logger
    this.logger.info('DatabaseOperationService initialized')
  }

  // ========== MAIN PUBLIC METHOD ==========

  async executeOperation(config: QueryConfig): Promise<any> {
    const startTime = Date.now()
    
    if (!this.pool) {
      return this.buildErrorResult('Database pool not available')
    }

    const client = await this.pool.connect()
    
    try {
      this.logger.debug('Database operation config:', config)
      
      let queryResult: QueryBuilderResult
      let result: any

      switch (config.operation) {
        case 'read':
          queryResult = this.buildSelectQuery(config)
          const selectResult = await client.query(queryResult.sql, queryResult.params)
          return selectResult.rows
          
        case 'create':
          if (Array.isArray(config.data)) {
            return await this.executeBatchCreate(config, client, startTime)
          }
          queryResult = this.buildInsertQuery(config)
          const insertResult = await client.query(queryResult.sql, queryResult.params)
          const returnData = config.returning ? insertResult.rows[0] : { id: insertResult.rows[0]?.id }
          return returnData
          
        case 'update':
          queryResult = this.buildUpdateQuery(config)
          const updateResult = await client.query(queryResult.sql, queryResult.params)
          const updateData = config.returning ? updateResult.rows[0] : { affectedRows: updateResult.rowCount }
          return updateData
          
        case 'delete':
          queryResult = this.buildDeleteQuery(config)
          const deleteResult = await client.query(queryResult.sql, queryResult.params)
          return { affectedRows: deleteResult.rowCount }
          
        case 'upsert':
          queryResult = this.buildUpsertQuery(config)
          const upsertResult = await client.query(queryResult.sql, queryResult.params)
          const upsertData = config.returning ? upsertResult.rows[0] : { success: true }
          return upsertData
          
        case 'count':
          queryResult = this.buildCountQuery(config)
          const countResult = await client.query(queryResult.sql, queryResult.params)
          return { count: parseInt(countResult.rows[0].count) }
          
        case 'exists':
          queryResult = this.buildExistsQuery(config)
          const existsResult = await client.query(queryResult.sql, queryResult.params)
          return  { exists: existsResult.rows[0].exists }
          
        case 'batch_create':
          return await this.executeBatchCreate(config, client, startTime)
          
        default:
          return this.buildErrorResult(`Unsupported database operation: ${config.operation}`)
      }
    } catch (error: any) {
      this.logger.error('Database operation failed:', error)
      return this.buildErrorResult(
        error.message,
        config,
        Date.now() - startTime,
        error
      )
    } finally {
      client.release()
    }
  }

  // ========== TRANSACTION METHODS ==========

  async executeInTransaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const client = await this.pool.connect()
    
    try {
      // Begin transaction
      let beginQuery = 'BEGIN'
      if (options?.isolationLevel) {
        beginQuery += ` ISOLATION LEVEL ${options.isolationLevel}`
      }
      if (options?.readOnly) {
        beginQuery += ' READ ONLY'
      }
      if (options?.deferrable) {
        beginQuery += ' DEFERRABLE'
      }
      
      await client.query(beginQuery)
      
      // Execute callback
      const result = await callback(client)
      
      // Commit transaction
      await client.query('COMMIT')
      
      return result
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async executeOperationsInTransaction(
    operations: QueryConfig[],
    options?: TransactionOptions
  ): Promise<DatabaseOperationResult[]> {
    return this.executeInTransaction(async (client) => {
      const results: DatabaseOperationResult[] = []
      
      for (const operation of operations) {
        const startTime = Date.now()
        
        try {
          let queryResult: QueryBuilderResult
          
          switch (operation.operation) {
            case 'read':
              queryResult = this.buildSelectQuery(operation)
              break
            case 'create':
              queryResult = this.buildInsertQuery(operation)
              break
            case 'update':
              queryResult = this.buildUpdateQuery(operation)
              break
            case 'delete':
              queryResult = this.buildDeleteQuery(operation)
              break
            default:
              throw new Error(`Operation ${operation.operation} not supported in transaction batch`)
          }
          
          const dbResult = await client.query(queryResult.sql, queryResult.params)
          
          results.push(this.buildSuccessResult(
            operation.returning ? dbResult.rows : { affectedRows: dbResult.rowCount },
            operation,
            Date.now() - startTime,
            { rowCount: dbResult.rowCount }
          ))
        } catch (error: any) {
          results.push(this.buildErrorResult(
            error.message,
            operation,
            Date.now() - startTime,
            error
          ))
          throw error // Rollback the entire transaction
        }
      }
      
      return results
    }, options)
  }

  // ========== QUERY BUILDERS ==========

  private buildSelectQuery(config: QueryConfig): QueryBuilderResult {
    const params: any[] = []
    let paramIndex = 1
    
    // SELECT clause
    const fields = config.fields === '*' || !config.fields 
      ? '*' 
      : config.fields.map(f => this.quoteIdentifier(f)).join(', ')
    
    let sql = `SELECT ${config.distinct ? 'DISTINCT ' : ''}${fields} FROM ${this.quoteIdentifier(config.table)}`
    
    // WHERE clause
    if (config.where) {
      const whereResult = this.buildWhereClause(config.where, paramIndex)
      sql += ` WHERE ${whereResult.clause}`
      params.push(...whereResult.params)
      paramIndex += whereResult.params.length
    }
    
    // GROUP BY clause
    if (config.groupBy && config.groupBy.length > 0) {
      sql += ` GROUP BY ${config.groupBy.map(g => this.quoteIdentifier(g)).join(', ')}`
      
      // HAVING clause
      if (config.having) {
        const havingResult = this.buildWhereClause(config.having, paramIndex)
        sql += ` HAVING ${havingResult.clause}`
        params.push(...havingResult.params)
        paramIndex += havingResult.params.length
      }
    }
    
    // ORDER BY clause
    if (config.orderBy) {
      const orderByClause = Object.entries(config.orderBy)
        .map(([field, direction]) => `${this.quoteIdentifier(field)} ${direction.toUpperCase()}`)
        .join(', ')
      sql += ` ORDER BY ${orderByClause}`
    }
    
    // LIMIT and OFFSET
    if (config.limit !== undefined) {
      sql += ` LIMIT $${paramIndex}`
      params.push(config.limit)
      paramIndex++
    }
    
    if (config.offset !== undefined) {
      sql += ` OFFSET $${paramIndex}`
      params.push(config.offset)
    }
    
    // RETURNING clause (PostgreSQL specific)
    if (config.returning) {
      const returning = config.returning === '*' 
        ? '*' 
        : config.returning.map(f => this.quoteIdentifier(f)).join(', ')
      sql += ` RETURNING ${returning}`
    }
    
    this.logger.debug('Select query:', { sql, params })
    return { sql, params }
  }

  private buildInsertQuery(config: QueryConfig): QueryBuilderResult {
    const params: any[] = []
    const data = this.sanitizeData(config.data as Record<string, any>)
    
    // Generate ID if not provided
    if (!data.id && !data._id) {
      data.id = generateEntityId("", config.table.toLowerCase())
    }
    
    const columns = Object.keys(data).map(col => this.quoteIdentifier(col))
    const values = Object.values(data)
    const placeholders = values.map((_, i) => `$${i + 1}`)
    
    let sql = `INSERT INTO ${this.quoteIdentifier(config.table)} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`
    
    // ON CONFLICT clause
    if (config.onConflict) {
      const target = config.onConflict.target.map(col => this.quoteIdentifier(col)).join(', ')
      sql += ` ON CONFLICT (${target})`
      
      if (config.onConflict.update && config.onConflict.update.length > 0) {
        const updates = config.onConflict.update.map(col => 
          `${this.quoteIdentifier(col)} = EXCLUDED.${this.quoteIdentifier(col)}`
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
        : config.returning.map(f => this.quoteIdentifier(f)).join(', ')
      sql += ` RETURNING ${returning}`
    } else {
      sql += ` RETURNING *`
    }
    
    this.logger.debug('Insert query:', { sql, params: values.concat(params) })
    return { sql, params: values.concat(params) }
  }

  private buildUpdateQuery(config: QueryConfig): QueryBuilderResult {
    const params: any[] = []
    let paramIndex = 1
    
    const data = this.sanitizeData(config.data as Record<string, any>)
    
    // Remove ID from update data to prevent accidental updates
    const { id, _id, ...updateData } = data
    
    if (Object.keys(updateData).length === 0) {
      throw new Error('Update operation requires data to update')
    }
    
    const setClause = Object.keys(updateData)
      .map((key, i) => `${this.quoteIdentifier(key)} = $${paramIndex + i}`)
      .join(', ')
    
    params.push(...Object.values(updateData))
    paramIndex += Object.keys(updateData).length
    
    let sql = `UPDATE ${this.quoteIdentifier(config.table)} SET ${setClause}`
    
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
        : config.returning.map(f => this.quoteIdentifier(f)).join(', ')
      sql += ` RETURNING ${returning}`
    }
    
    this.logger.debug('Update query:', { sql, params })
    return { sql, params }
  }

  private buildDeleteQuery(config: QueryConfig): QueryBuilderResult {
    const params: any[] = []
    let paramIndex = 1
    
    let sql = `DELETE FROM ${this.quoteIdentifier(config.table)}`
    
    // WHERE clause (required for safety, but can be overridden with explicit condition)
    if (config.where) {
      const whereResult = this.buildWhereClause(config.where, paramIndex)
      sql += ` WHERE ${whereResult.clause}`
      params.push(...whereResult.params)
    } else {
      // Prevent accidental delete all
      throw new Error('Delete operation requires a WHERE clause for safety')
    }
    
    // RETURNING clause
    if (config.returning) {
      const returning = config.returning === '*' 
        ? '*' 
        : config.returning.map(f => this.quoteIdentifier(f)).join(', ')
      sql += ` RETURNING ${returning}`
    }
    
    this.logger.debug('Delete query:', { sql, params })
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
    
    let sql = `SELECT COUNT(*) as count FROM ${this.quoteIdentifier(config.table)}`
    
    // WHERE clause
    if (config.where) {
      const whereResult = this.buildWhereClause(config.where, paramIndex)
      sql += ` WHERE ${whereResult.clause}`
      params.push(...whereResult.params)
    }
    
    this.logger.debug('Count query:', { sql, params })
    return { sql, params }
  }

  private buildExistsQuery(config: QueryConfig): QueryBuilderResult {
    const params: any[] = []
    let paramIndex = 1
    
    let sql = `SELECT EXISTS(SELECT 1 FROM ${this.quoteIdentifier(config.table)}`
    
    // WHERE clause
    if (config.where) {
      const whereResult = this.buildWhereClause(config.where, paramIndex)
      sql += ` WHERE ${whereResult.clause}`
      params.push(...whereResult.params)
    }
    
    sql += `) as exists`
    
    this.logger.debug('Exists query:', { sql, params })
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
      
      const logicalOperator = where[0]?.logical || 'AND'
      return {
        clause: conditions.join(` ${logicalOperator} `),
        params
      }
    } else {
      // Handle simple object format
      const conditions = Object.entries(where).map(([field, value]) => {
        let operator = '='
        let paramValue = value
        
        // Parse special operators from field name
        const operatorMatch = field.match(/__(.+)$/)
        if (operatorMatch) {
          const [fullMatch, op] = operatorMatch
          field = field.replace(fullMatch, '')
          
          switch (op) {
            case 'neq': operator = '!='; break
            case 'gt': operator = '>'; break
            case 'gte': operator = '>='; break
            case 'lt': operator = '<'; break
            case 'lte': operator = '<='; break
            case 'like': operator = 'LIKE'; paramValue = `%${value}%`; break
            case 'ilike': operator = 'ILIKE'; paramValue = `%${value}%`; break
            case 'in': operator = 'IN'; break
            case 'not_in': operator = 'NOT IN'; break
            case 'is_null': operator = 'IS NULL'; paramValue = undefined; break
            case 'is_not_null': operator = 'IS NOT NULL'; paramValue = undefined; break
            case 'contains': operator = '@>'; break // JSON/array contains
            case 'contained_by': operator = '<@'; break // JSON/array contained by
            case 'overlaps': operator = '&&'; break // Arrays overlap
            case 'between': operator = 'BETWEEN'; break
            default: operator = '='
          }
        }
        
        const clause = this.buildConditionClause(
          this.quoteIdentifier(field),
          operator,
          paramValue,
          paramIndex
        )
        
        const conditionParams = this.getConditionParams(paramValue, operator)
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
    const { field, operator, value } = condition
    const quotedField = this.quoteIdentifier(field)
    
    const clause = this.buildConditionClause(quotedField, operator, value, paramIndex)
    const params = this.getConditionParams(value, operator)
    
    return { clause, params }
  }

  private buildConditionClause(field: string, operator: string, value: any, paramIndex: number): string {
    switch (operator) {
      case 'in':
      case 'not_in':
        if (!Array.isArray(value)) {
          throw new Error(`${operator.toUpperCase()} operator requires an array value`)
        }
        const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(', ')
        return `${field} ${operator.toUpperCase()} (${placeholders})`
      
      case 'is_null':
      case 'is_not_null':
        return `${field} ${operator.toUpperCase().replace('_', ' ')}`
      
      case 'between':
        if (!Array.isArray(value) || value.length !== 2) {
          throw new Error('BETWEEN operator requires an array of two values')
        }
        return `${field} BETWEEN $${paramIndex} AND $${paramIndex + 1}`
      
      default:
        return `${field} ${operator.toUpperCase()} $${paramIndex}`
    }
  }

  private getConditionParams(value: any, operator: string): any[] {
    if (value === undefined || operator.includes('null')) {
      return []
    }
    
    if (operator === 'in' || operator === 'not_in' || operator === 'between') {
      return Array.isArray(value) ? value : [value]
    }
    
    return [value]
  }

  // ========== HELPER METHODS ==========

  private async executeBatchCreate(
    config: QueryConfig, 
    client: PoolClient, 
    startTime: number
  ): Promise<any> {
    if (!Array.isArray(config.data) || config.data.length === 0) {
      return this.buildErrorResult('batch_create operation requires a non-empty array of data')
    }
    
    const results: any[] = []
    
    for (const item of config.data) {
      const itemConfig = {
        ...config,
        data: item,
        operation: 'create' as const
      }
      
      const queryResult = this.buildInsertQuery(itemConfig)
      const result = await client.query(queryResult.sql, queryResult.params)
      results.push(config.returning ? result.rows[0] : { id: result.rows[0]?.id })
    }
    
    return results
  }

  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        continue // Skip undefined values
      }
      
      // Handle dates
      if (value instanceof Date) {
        sanitized[key] = value.toISOString()
      }
      // Handle JSON objects/arrays
      else if (typeof value === 'object' && value !== null && !(value instanceof Buffer)) {
        sanitized[key] = JSON.stringify(value)
      }
      // Handle SQL functions
      else if (typeof value === 'string' && value.startsWith('NOW()')) {
        sanitized[key] = value // Pass through SQL functions
      }
      // Handle other types
      else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }

  private quoteIdentifier(identifier: string): string {
    // Check if identifier contains reserved keywords
    const lowerIdentifier = identifier.toLowerCase()
    
    if (this.reservedKeywords.has(lowerIdentifier) || identifier.includes('.')) {
      return `"${identifier}"`
    }
    
    return identifier
  }

  private buildSuccessResult(
    data: any,
    config: QueryConfig,
    duration: number,
    metadata?: any
  ): DatabaseOperationResult {
    return {
      success: true,
      data,
      count: Array.isArray(data) ? data.length : undefined,
      affectedRows: metadata?.rowCount,
      query: `${config.operation} on ${config.table}`,
      duration,
      metadata: {
        operation: config.operation,
        table: config.table,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    }
  }

  private buildErrorResult(
    error: string,
    config?: QueryConfig,
    duration?: number,
    originalError?: any
  ): DatabaseOperationResult {
    return {
      success: false,
      error,
      duration,
      query: config ? `${config.operation} on ${config.table}` : undefined,
      metadata: {
        operation: config?.operation,
        table: config?.table,
        timestamp: new Date().toISOString(),
        originalError: originalError?.message
      }
    }
  }

  // ========== UTILITY METHODS ==========

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect()
      await client.query('SELECT 1')
      client.release()
      return true
    } catch (error) {
      this.logger.error('Database connection test failed:', error)
      return false
    }
  }

  async getTableInfo(tableName: string): Promise<any> {
    try {
      const result = await this.pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName])
      
      return result.rows
    } catch (error) {
      this.logger.error(`Failed to get table info for ${tableName}:`, error)
      throw error
    }
  }

  async executeRawQuery<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    return await this.pool.query(sql, params)
  }

  // ========== BULK OPERATIONS ==========

  async bulkInsert(
    table: string,
    data: Record<string, any>[],
    batchSize: number = 1000,
    onConflict?: QueryConfig['onConflict']
  ): Promise<DatabaseOperationResult> {
    const startTime = Date.now()
    const results: any[] = []
    const errors: any[] = []
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      
      try {
        const result = await this.executeOperation({
          operation: 'batch_create',
          table,
          data: batch,
          onConflict
        })
        
        if (result.success) {
          results.push(...(Array.isArray(result.data) ? result.data : [result.data]))
        } else {
          errors.push({ batch: i / batchSize, error: result.error })
        }
      } catch (error: any) {
        errors.push({ batch: i / batchSize, error: error.message })
      }
    }
    
    return {
      success: errors.length === 0,
      data: results,
      count: results.length,
      error: errors.length > 0 ? `Failed ${errors.length} batches` : undefined,
      duration: Date.now() - startTime,
      metadata: {
        operation: 'bulk_insert',
        table,
        batches: Math.ceil(data.length / batchSize),
        successfulBatches: results.length,
        failedBatches: errors.length,
        timestamp: new Date().toISOString()
      }
    }
  }

  async softDelete(
    table: string,
    where: Record<string, any>,
    deletedBy?: string
  ): Promise<DatabaseOperationResult> {
    return this.executeOperation({
      operation: 'update',
      table,
      data: {
        deleted_at: 'NOW()',
        deleted_by: deletedBy
      },
      where,
      returning: '*'
    })
  }
}