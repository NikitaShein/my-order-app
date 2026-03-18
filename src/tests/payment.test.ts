import { handler } from "../lambdas/payment";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);

describe("payment handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.ORDERS_TABLE = "TestTable";
  });

  it("should update paymentStatus to PAID", async () => {
    ddbMock.on(UpdateCommand).resolves({});

    const event = { orderId: "ORDER-123" };
    const result = await handler(event);

    expect(ddbMock.calls()).toHaveLength(1);
    const updateCall = ddbMock.call(0).args[0] as UpdateCommand;

    expect(updateCall.input.UpdateExpression).toContain(
      "SET paymentStatus = :status"
    );
    expect(updateCall.input.ExpressionAttributeValues?.[":status"]).toBe(
      "PAID"
    );

    expect(result.paymentStatus).toBe("PAID");
  });
});
