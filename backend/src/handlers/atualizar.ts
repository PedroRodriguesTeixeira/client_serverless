import type { APIGatewayEvent } from "aws-lambda";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { ddbDocClient } from "../services/searchClient";

const json = (statusCode: number, message: string) => ({
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
});

export const handler = async (event: APIGatewayEvent) => {
    const pk = event.pathParameters?.pk;
    if (!pk) return json(400, "pk não informado.");
    if (event.body === null) return json(400, "Corpo da requisição vazio.");

    let request;
    try {
        request = JSON.parse(event.body);
    } catch {
        return json(400, "JSON inválido.");
    }

    const { nome, email, telefone } = request;
    if (!nome || !email || !telefone) {
        return json(400, "nome, email e telefone são obrigatórios.");
    }

    try {
        await ddbDocClient.send(new UpdateCommand({
            TableName: process.env.TABLE_NAME,
            Key: { pk },
            UpdateExpression: "SET #nome = :nome, #email = :email, #telefone = :telefone",
            ConditionExpression: "attribute_exists(pk)",
            ExpressionAttributeNames: { "#nome": "nome", "#email": "email", "#telefone": "telefone" },
            ExpressionAttributeValues: { ":nome": nome, ":email": email, ":telefone": telefone }
        }));
        return json(200, "Usuário atualizado com sucesso!");
    } catch (e) {
        if (e instanceof ConditionalCheckFailedException) return json(404, "Usuário não encontrado!");
        console.error(e);
        return json(500, "Erro ao atualizar o usuário.");
    }
};
