//dynamo
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
export const client = new DynamoDBClient({});
export const ddbDocClient = DynamoDBDocumentClient.from(client);


export async function search(pk: string) {

    try {
        const response = await ddbDocClient.send(
            new GetCommand({
                TableName: process.env.TABLE_NAME,
                Key: {
                    pk: pk
                }
            })
        )

        return response;
    } catch(e){
        throw e;
    }
    
}