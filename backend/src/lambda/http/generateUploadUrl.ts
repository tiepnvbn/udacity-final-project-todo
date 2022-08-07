import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { getSignedUploadUrl } from '../../businessLogic/todos'
import { getToken, parseUserId } from '../../auth/utils'
const logger = createLogger('get-s3-url')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('get signed upload s3 url')
    try {
      const jwtToken = getToken(event.headers.Authorization)
      const todoId = event.pathParameters.todoId
      const userId = parseUserId(jwtToken)
      logger.info('userId: ',userId)
      // TODO: Return a presigned URL to upload a file for a TODO item with the provided id

      const url: string = await getSignedUploadUrl(todoId, userId)
      return {
        statusCode: 200,
        body: JSON.stringify({
          uploadUrl: url
        })
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
