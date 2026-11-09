//lambda
import type { APIGatewayEvent, APIGatewayProxyEvent } from "aws-lambda";

//dynamo
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient, type GetCommandOutput } from "@aws-sdk/lib-dynamodb";
export const client = new DynamoDBClient({});
export const ddbDocClient = DynamoDBDocumentClient.from(client);

//searchClient
import { search } from "../services/searchClient"

export const handler = async (event: APIGatewayEvent) => {


    const pk = event.pathParameters?.pk;
    let response: GetCommandOutput;

    if (pk) {
        response = await search(pk)
    } else {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "pk não informado." })
        };
    }


    try {

        const client = (await response).Item;


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