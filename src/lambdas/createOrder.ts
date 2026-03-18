import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { OrderStatus, PaymentStatus, ShippingStatus } from "../orderStatuses";
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface OrderRequest {
  orderId: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Empty request body" }),
      };
    }

    const body: OrderRequest = JSON.parse(event.body);
    const { orderId } = body;

    if (!orderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "orderId is required" }),
      };
    }

    const params = {
      TableName: process.env.ORDERS_TABLE,
      Item: {
        orderId: orderId,
        status: OrderStatus.CREATED,
        paymentStatus: PaymentStatus.PENDING,
        shippingStatus: ShippingStatus.PENDING,
        createdAt: new Date().toISOString(),
      },
      ConditionExpression: "attribute_not_exists(orderId)",
    };

    await docClient.send(new PutCommand(params));

    const sfnClient = new SFNClient({});

    await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn: process.env.STATE_MACHINE_ARN,
        input: JSON.stringify({ orderId }),
        name: orderId,
      })
    );

    return {
      statusCode: 202,
      body: JSON.stringify({
        message: "Order created and processing started",
        orderId,
      }),
    };
  } catch (err: any) {
    if (err.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: `Order with ID ${
            JSON.parse(event.body!).orderId
          } already exists`,
        }),
      };
    }

    if (err.name === "ExecutionAlreadyExists") {
      const orderId =
        typeof event.body === "string"
          ? JSON.parse(event.body)?.orderId
          : undefined;

      return {
        statusCode: 202,
        body: JSON.stringify({
          message: "Order processing already started",
          orderId,
        }),
      };
    }

    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
