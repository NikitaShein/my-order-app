import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { OrderStatus } from "../orderStatuses";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const isApiGatewayProxyEvent = (event: any): event is APIGatewayProxyEvent =>
  typeof event?.body === "string" || event?.pathParameters != null;

const extractOrderId = (event: any): string | undefined => {
  if (Array.isArray(event)) return event?.[0]?.orderId;
  if (event?.orderId) return event?.orderId;
  if (event?.pathParameters?.orderId) return event.pathParameters.orderId;
  if (typeof event?.body === "string") {
    try {
      const body = JSON.parse(event.body);
      return body?.orderId;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

export const handler = async (
  event: any
): Promise<APIGatewayProxyResult | { orderId: string; finalStatus: string }> => {
  const orderId = extractOrderId(event);

  if (!orderId) {
    throw new Error("orderId is required");
  }

  const params = {
    TableName: process.env.ORDERS_TABLE,
    Key: { orderId },
    UpdateExpression:
      "SET #s = :status, cancelledAt = :cancelledAt",
    ExpressionAttributeNames: {
      "#s": "status",
    },
    ExpressionAttributeValues: {
      ":status": OrderStatus.CANCELLED,
      ":cancelledAt": new Date().toISOString(),
    },
  };

  await docClient.send(new UpdateCommand(params));

  const result = { orderId, finalStatus: OrderStatus.CANCELLED };
  if (isApiGatewayProxyEvent(event)) {
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  }

  return result;
};
