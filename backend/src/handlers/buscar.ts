
import type { APIGatewayEvent, APIGatewayProxyEvent } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";


export const client = new DynamoDBClient({});

export const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayEvent) => {


    const pk = event.pathParameters?.pk;

    try {

        const response = await ddbDocClient.send(
            new GetCommand({
                TableName: process.env.TABLE_NAME,
                Key: {
                    pk: pk
                }
            })
        )

        const client = response.Item;

        if (!client) {
            return {
                statusCode: 404,
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": JSON.stringify({
                    message: "Usuário errado ou inválido."
                })
            }
        }


        return {
            statusCode: 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({
                message: client
            })
        }

    } catch (e) {
        throw e;
    }



};