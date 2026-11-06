
import type {APIGatewayProxyEvent } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { incrementalPk } from "../services/incrementalPkService";

export const client = new DynamoDBClient({});

export const ddbDocClient = DynamoDBDocumentClient.from(client);


export const handler = async (event: APIGatewayProxyEvent) => {

    let request = null;
    if(event.body !== null){
        request = JSON.parse(event.body);
    } else {
            return {
            statusCode: 400,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "Corpo da requisição vazio."
            })
        };
    }
    
    
    try {

          const pkName = await incrementalPk();
        
           const response = await ddbDocClient.send(
            new PutCommand({
                TableName: process.env.TABLE_NAME,
                Item: {
                    pk: pkName,
                    nome: request['nome'],
                    email: request['email'],
                    telefone: request['telefone']
                }
            })
        ) 

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: "Usuário criado com sucesso!"
            })
        };
    } catch (e) {
            return {
            statusCode: 400,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: e
            })
        };
    }


};