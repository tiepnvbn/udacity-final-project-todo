import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class TodosAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly todosIndex = process.env.TODOS_ID_INDEX,
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
        private readonly urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION),
        private readonly s3 = new XAWS.S3({
            signatureVersion: 'v4'
        }),
    ) {
    }

    async getTodosByUserId(userId: string): Promise<TodoItem[]> {
        logger.info('log event getTodosByUserId')
        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todosIndex,
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId
            }
        }).promise()

        const items = result.Items
        logger.info(items)
        return items as TodoItem[]
    }

    async createTodo(todoItem: TodoItem): Promise<TodoItem> {
        logger.info('Storing new item: ', todoItem.todoId)
        const newItem = {
            ...todoItem,
            attachmentUrl: `https://${this.bucketName}.s3.amazonaws.com/${todoItem.todoId}`
        }
        await this.docClient.put({
            TableName: this.todosTable,
            Item: newItem
        }).promise()
        logger.info(newItem)
        return newItem
    }

    async updateTodo(todoItem: TodoItem): Promise<void> {
        logger.info('Updating new item: ', todoItem.todoId)
        const updateExpression = 'set #name = :name, #dueDate = :dueDate, #done = :done'
        const conditionExpression = 'todoId = :todoId'
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId: todoItem.todoId,
                userId: todoItem.userId
            },
            UpdateExpression: updateExpression,
            ConditionExpression: conditionExpression,
            ExpressionAttributeNames: {
                '#name': 'name',
                '#dueDate': 'dueDate',
                '#done': 'done'
            },
            ExpressionAttributeValues: {
                ':name': todoItem.name,
                ':dueDate': todoItem.dueDate,
                ':done': todoItem.done,
                ':todoId': todoItem.todoId
            }
        }).promise()
        logger.info(todoItem)
    }

    async getSignedUploadUrl(todoId: string, userId: string): Promise<string> {
        logger.info('getting upload url')
        const attachmentUrl = this.s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: todoId,
            Expires: this.urlExpiration
        })
        logger.info(attachmentUrl)

        this.docClient.update(
            {
                TableName: this.todosTable,
                Key: {
                    todoId,
                    userId,
                },
                UpdateExpression: "set attachmentUrl = :attachmentUrl",
                ExpressionAttributeValues: {
                    ":attachmentUrl": `https://${this.bucketName}.s3.amazonaws.com/${todoId}`,
                }
            }
        )
        return attachmentUrl

    }

    async deleteTodo(todoId: string, userId: string): Promise<void> {
        logger.info('deleting Todo item: ', todoId)
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            },
            ConditionExpression: 'todoId = :todoId',
            ExpressionAttributeValues: {
                ':todoId': todoId
            }
        }).promise()

        //delete s3 object
        const params = {
            Bucket: this.bucketName,
            Key: todoId
        }
        await this.s3.deleteObject(params, function (err, data) {
            if (err) logger.info('error while deleting object', err.stack)
            else logger.info(data)
        }).promise()
    }
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        logger.info('Creating a local DynamoDB instance')
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new XAWS.DynamoDB.DocumentClient()
}