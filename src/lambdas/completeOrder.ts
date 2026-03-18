import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { OrderStatus } from "../orderStatuses";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  const orderId = event[0].orderId;

  const params = {
    TableName: process.env.ORDERS_TABLE,
    Key: { orderId },
    UpdateExpression: "SET #s = :status",
    ExpressionAttributeNames: {
      "#s": "status",
    },
    ExpressionAttributeValues: {
      ":status": OrderStatus.COMPLETED,
      ":failed": OrderStatus.FAILED,
      ":cancelled": OrderStatus.CANCELLED,
    },
    ConditionExpression: "#s <> :failed AND #s <> :cancelled",
  };

  try {
    await docClient.send(new UpdateCommand(params));
    return { orderId, finalStatus: OrderStatus.COMPLETED };
  } catch (err) {
    console.error("Finalize error:", err);
    throw err;
  }
};
