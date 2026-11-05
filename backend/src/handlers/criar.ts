 
import {APIGatewayEvent, APIGatewayProxyEvent} from "aws-lambda";

import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});


export const handler = async (event: APIGatewayProxyEvent) => {

};