import type { APIGatewayProxyEvent } from "aws-lambda";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";

import { search, ddbDocClient } from "../services/searchClient";

export const handler = async (event: APIGatewayProxyEvent) => {

    const pk = event.pathParameters?.pk;

    if (!pk) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "pk não informado." })
        };
    }

    try {
        // Confere se o cliente existe antes de excluir
        const existente = await search(pk);

        if (!existente.Item) {
            return {
                statusCode: 404,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Usuário não encontrado!" })
            };
        }

        await ddbDocClient.send(
            new DeleteCommand({
                TableName: process.env.TABLE_NAME,
                Key: { pk }
            })
        );

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Usuário excluído com sucesso!" })
        };
    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Erro ao excluir o usuário." })
        };
    }
};
