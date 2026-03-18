import { handler } from "../lambdas/createOrder";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { mockClient } from "aws-sdk-client-mock";
import { APIGatewayProxyEvent } from "aws-lambda";

const ddbMock = mockClient(DynamoDBDocumentClient);
const sfnMock = mockClient(SFNClient);

describe("createOrder handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    sfnMock.reset();
    process.env.ORDERS_TABLE = "TestTable";
    process.env.STATE_MACHINE_ARN = "arn:aws:states:sfn";
  });

  it("should create an order and start state machine", async () => {
    ddbMock.on(PutCommand).resolves({});
    sfnMock.on(StartExecutionCommand).resolves({ executionArn: "arn" });

    const event = {
      body: JSON.stringify({ orderId: "ORDER-123" }),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(202);
    expect(ddbMock.calls()).toHaveLength(1);
    expect(sfnMock.calls()).toHaveLength(1);
  });

  it("should return 409 if order already exists", async () => {
    ddbMock.on(PutCommand).rejects({
      name: "ConditionalCheckFailedException",
    });

    const event = {
      body: JSON.stringify({ orderId: "ORDER-123" }),
    } as APIGatewayProxyEvent;

    const result = await handler(event);

    expect(result.statusCode).toBe(409);
    expect(sfnMock.calls()).toHaveLength(0);
  });
});
