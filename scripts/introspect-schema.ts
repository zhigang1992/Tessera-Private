/**
 * Introspect GraphQL schema and save to schema.graphql
 * Run with: bun run scripts/introspect-schema.ts
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

const GRAPHQL_ENDPOINT = 'https://tracker-gql-dev.tessera.fun/v1/graphql'

const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types {
        ...FullType
      }
      directives {
        name
        description
        locations
        args {
          ...InputValue
        }
      }
    }
  }

  fragment FullType on __Type {
    kind
    name
    description
    fields(includeDeprecated: true) {
      name
      description
      args {
        ...InputValue
      }
      type {
        ...TypeRef
      }
      isDeprecated
      deprecationReason
    }
    inputFields {
      ...InputValue
    }
    interfaces {
      ...TypeRef
    }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes {
      ...TypeRef
    }
  }

  fragment InputValue on __InputValue {
    name
    description
    type { ...TypeRef }
    defaultValue
  }

  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`

interface GraphQLType {
  kind: string
  name?: string
  ofType?: GraphQLType
}

interface GraphQLField {
  name: string
  description?: string
  type: GraphQLType
  args: Array<{ name: string; type: GraphQLType; defaultValue?: string }>
  isDeprecated?: boolean
  deprecationReason?: string
}

interface GraphQLInputValue {
  name: string
  description?: string
  type: GraphQLType
  defaultValue?: string
}

interface GraphQLEnumValue {
  name: string
  description?: string
  isDeprecated?: boolean
  deprecationReason?: string
}

interface GraphQLTypeInfo {
  kind: string
  name: string
  description?: string
  fields?: GraphQLField[]
  inputFields?: GraphQLInputValue[]
  interfaces?: GraphQLType[]
  enumValues?: GraphQLEnumValue[]
  possibleTypes?: GraphQLType[]
}

interface IntrospectionResult {
  data: {
    __schema: {
      queryType: { name: string }
      mutationType?: { name: string }
      subscriptionType?: { name: string }
      types: GraphQLTypeInfo[]
      directives: Array<{
        name: string
        description?: string
        locations: string[]
        args: GraphQLInputValue[]
      }>
    }
  }
}

function printType(type: GraphQLType): string {
  if (type.kind === 'NON_NULL') {
    return `${printType(type.ofType!)}!`
  }
  if (type.kind === 'LIST') {
    return `[${printType(type.ofType!)}]`
  }
  return type.name || ''
}

function printSchema(schema: IntrospectionResult['data']['__schema']): string {
  let output = ''

  // Filter out built-in types
  const userTypes = schema.types.filter(
    (type) => !type.name.startsWith('__')
  )

  // Print types
  for (const type of userTypes) {
    if (type.description) {
      output += `"""\n${type.description}\n"""\n`
    }

    if (type.kind === 'OBJECT') {
      output += `type ${type.name} {\n`
      if (type.fields) {
        for (const field of type.fields) {
          if (field.description) {
            output += `  """\n  ${field.description}\n  """\n`
          }
          const args = field.args.length > 0
            ? `(${field.args.map((arg) => `${arg.name}: ${printType(arg.type)}`).join(', ')})`
            : ''
          output += `  ${field.name}${args}: ${printType(field.type)}\n`
        }
      }
      output += `}\n\n`
    } else if (type.kind === 'INPUT_OBJECT') {
      output += `input ${type.name} {\n`
      if (type.inputFields) {
        for (const field of type.inputFields) {
          if (field.description) {
            output += `  """\n  ${field.description}\n  """\n`
          }
          output += `  ${field.name}: ${printType(field.type)}\n`
        }
      }
      output += `}\n\n`
    } else if (type.kind === 'ENUM') {
      output += `enum ${type.name} {\n`
      if (type.enumValues) {
        for (const value of type.enumValues) {
          if (value.description) {
            output += `  """\n  ${value.description}\n  """\n`
          }
          output += `  ${value.name}\n`
        }
      }
      output += `}\n\n`
    } else if (type.kind === 'SCALAR') {
      output += `scalar ${type.name}\n\n`
    } else if (type.kind === 'UNION') {
      output += `union ${type.name} = ${type.possibleTypes?.map((t) => t.name).join(' | ')}\n\n`
    } else if (type.kind === 'INTERFACE') {
      output += `interface ${type.name} {\n`
      if (type.fields) {
        for (const field of type.fields) {
          if (field.description) {
            output += `  """\n  ${field.description}\n  """\n`
          }
          output += `  ${field.name}: ${printType(field.type)}\n`
        }
      }
      output += `}\n\n`
    }
  }

  return output
}

async function introspectSchema() {
  console.log('Introspecting GraphQL schema from:', GRAPHQL_ENDPOINT)

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: INTROSPECTION_QUERY,
    }),
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`)
  }

  const result: IntrospectionResult = await response.json()

  if (!result.data) {
    throw new Error('Invalid introspection result')
  }

  console.log('Introspection successful! Generating schema.graphql...')

  const schemaText = printSchema(result.data.__schema)
  const schemaPath = join(process.cwd(), 'schema.graphql')

  writeFileSync(schemaPath, schemaText, 'utf-8')

  console.log(`✓ Schema saved to: ${schemaPath}`)
  console.log(`✓ Found ${result.data.__schema.types.length} types`)
}

// Run the introspection
introspectSchema().catch((error) => {
  console.error('Error introspecting schema:', error)
  process.exit(1)
})
