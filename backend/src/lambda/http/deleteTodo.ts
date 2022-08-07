import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { getToken } from '../../auth/utils'
import { deleteTodo } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'
const logger = createLogger('delete-todo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('delete todo by todoid')
    try {
      const todoId = event.pathParameters.todoId
      // TODO: Remove a TODO item by id
      const jwtToken = getToken(event.headers.Authorization)
      await deleteTodo(todoId, jwtToken)
      return {
        statusCode: 200,
        body: JSON.stringify(true)
      }
    } catch (e) {
      logger.error(e.message)
      return {
        statusCode: 500,
        body: e.message
      }
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
