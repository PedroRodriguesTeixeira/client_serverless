 
import {APIGatewayProxyEvent} from "aws-lambda";

import {DynamoDBClient, GetItemCommand} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event: APIGatewayProxyEvent) => {

    return {
    "statusCode": 200,
    "headers": {
        "Content-Type": "application/json"
    },
    "body": JSON.stringify({
        message: "Ok."
    })

}

    

    
};