import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { OrderStatus, ShippingStatus } from "../orderStatuses";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  const { orderId } = event;

  const params = {
    TableName: process.env.ORDERS_TABLE,
    Key: { orderId },
    UpdateExpression: "SET shippingStatus = :status",
    ExpressionAttributeValues: {
      ":status": ShippingStatus.SHIPPED,
      ":cancelled": OrderStatus.CANCELLED,
      ":failed": OrderStatus.FAILED,
    },
    ConditionExpression: "#s <> :cancelled AND #s <> :failed",
    ExpressionAttributeNames: {
      "#s": "status",
    },
  };

  await docClient.send(new UpdateCommand(params));
  return { orderId, shippingStatus: ShippingStatus.SHIPPED };
};
