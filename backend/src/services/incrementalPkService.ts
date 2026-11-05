import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

export const client = new DynamoDBClient({});

export const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function incrementalPk() {


    const command = new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
            pk: "FINAL#CLIENT"
        }
    });


    let item;
    try {

        const answer = await ddbDocClient.send(command);
        item = answer.Item;
        item = item?.lastClient + 1;

    } catch (e) {
        return e;
    }


    try {
        const response = await ddbDocClient.send(
            new PutCommand({
                TableName: process.env.TABLE_NAME,
                Item: {
                    pk: "FINAL#CLIENT",
                    lastClient: item
                }
            })
        )

    } catch (e) {
        return e;
    }


    return "CLIENTE#" + item;





}