import { api as civicApi } from '@/src/lib/convexApi'

export const api = civicApi as any

export type Id<TableName extends string> = string & { __tableName: TableName }
