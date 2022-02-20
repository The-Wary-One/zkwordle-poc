import fastify from 'fastify'
import { getGraphQLParameters, processRequest, renderGraphiQL, sendResult, shouldRenderGraphiQL, Request as HRequest } from 'graphql-helix'
import { envelop, useLogger, useSchema, useTiming, useMaskedErrors, useErrorHandler } from '@envelop/core'
import { useParserCache } from '@envelop/parser-cache'
import { useValidationCache } from '@envelop/validation-cache'
import { useDepthLimit } from '@envelop/depth-limit'
import { useGraphQlJit } from '@envelop/graphql-jit'
import { useResponseCache } from '@envelop/response-cache'
import { useOpenTelemetry } from '@envelop/opentelemetry'
import { useRateLimiter } from '@envelop/rate-limiter'

import { getSchema } from './graphql'

const NODE_ENV = process.env.NODE_ENV ?? 'production'
const HOST = process.env.HOST ?? '0.0.0.0'
const PORT = process.env.PORT ?? 3001

type Request = HRequest & {
    custom: {
        ip: string;
    },
}

const app = fastify()

async function main() {
    const schema = await getSchema()
    const getEnveloped = envelop({
        plugins: [
            useSchema(schema),
            useParserCache(),
            useValidationCache(),
            useResponseCache({
                ttl: 1 * 60 * 1000, // cache 1min
                ttlPerSchemaCoordinate: {
                    'Query.__schema': undefined, // cache infinitely
                    'Query.validGuesses': undefined, // cache infinitely
                },
            }),
            useLogger(),
            useTiming(),
            useErrorHandler(errors => {
                errors.forEach(e => console.error(e))
            }),
            useMaskedErrors({ errorMessage: 'Internal Server Error' }),
            //useOpenTelemetry({
            //    resolvers: true, // Tracks resolvers calls, and tracks resolvers thrown errors
            //    variables: true, // Includes the operation variables values as part of the metadata collected
            //    result: false, // Includes execution result object as part of the metadata collected
            //}),
            useDepthLimit({
                maxDepth: 10,
            }),
            useGraphQlJit(),
            useRateLimiter({
                identifyFn: context => (context as { request: Request }).request.custom.ip,
            }),
        ],
    })

    app.route({
        method: ['GET', 'POST'],
        url: '/graphql',
        async handler(req, res) {
            const { parse, validate, contextFactory, execute, schema } = getEnveloped({ req })
            // Create a generic Request object that can be consumed by Graphql Helix's API
            const request: Request = {
                body: req.body,
                headers: req.headers,
                method: req.method,
                query: req.query,
                custom: {
                    ip: req.ip,
                },
            }

            // Determine whether we should render GraphiQL instead of returning an API response
            if (req.method === 'GET' && NODE_ENV === 'production') {
                res.callNotFound()
                return
            }
            if (shouldRenderGraphiQL(request)) {
                res.type('text/html')
                res.send(renderGraphiQL())
            } else {
                // Extract the Graphql parameters from the request
                const { operationName, query, variables } = getGraphQLParameters(request)
                // Validate and execute the query
                const result = await processRequest({
                    operationName,
                    query,
                    variables,
                    request,
                    schema,
                    parse,
                    validate,
                    execute,
                    contextFactory,
                })

                // processRequest returns one of three types of results depending on how the server should respond
                // 1) RESPONSE: a regular JSON payload
                // 2) MULTIPART RESPONSE: a multipart response (when @stream or @defer directives are used)
                // 3) PUSH: a stream of events to push back down the client for a subscription
                // The 'sendResult' is a NodeJS-only shortcut for handling all possible types of Graphql responses,
                // See 'Advanced Usage' below for more details and customizations available on that layer.
                sendResult(result, res.raw)

                // Tell fastify a response was sent
                res.sent = true
            }
        },
    })

    app.listen(PORT, HOST, () => {
        console.log(`GraphQL server is running on: ${HOST}:${PORT}`)
    })
}

main().catch(e => {
    console.error(e)
    process.exit(1)
})