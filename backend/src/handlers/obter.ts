
import type { APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent) => {

    try {
        const response = await ddbDocClient.send(
            new ScanCommand({
                TableName: process.env.TABLE_NAME
            })
        )

        const clients = response.Items ?? [];


        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                message: clients
            })
        }



    } catch (e) {

        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                message: e
            })
        }
    }


}

