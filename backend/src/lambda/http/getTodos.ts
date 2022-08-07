import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { getTodosByUserId as getTodosByUserId } from '../../businessLogic/todos'
import { getUserId } from '../utils';
const logger = createLogger('get-todo')

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
    logger.info('get todos')
    try {
      const userId = getUserId(event)
      // const jwtToken = getToken(event.headers.Authorization)
      const todos = await getTodosByUserId(userId)
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          items: todos
        })
      }
    } catch (e) {
      logger.error('Error: ' + e.message)
      return {
        statusCode: 500,
        body: e.message
      }
    }
  }
)
handler.use(
  cors({
    credentials: true
  })
)
