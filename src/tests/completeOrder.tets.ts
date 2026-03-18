import { handler } from "../lambdas/completeOrder";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);

describe("completeOrder handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.ORDERS_TABLE = "TestTable";
  });

  it("should set order status to COMPLETED", async () => {
    ddbMock.on(UpdateCommand).resolves({});

    const event = [
      { orderId: "ORDER-123", paymentStatus: "PAID" },
      { orderId: "ORDER-123", shippingStatus: "SHIPPED" },
    ];

    const result = await handler(event);

    expect(ddbMock.calls()).toHaveLength(1);
    const updateCall = ddbMock.call(0).args[0] as UpdateCommand;

    expect(updateCall.input.ExpressionAttributeNames?.["#s"]).toBe("status");
    expect(updateCall.input.ExpressionAttributeValues?.[":status"]).toBe(
      "COMPLETED"
    );

    expect(result.finalStatus).toBe("COMPLETED");
  });

  it("should throw error if update fails", async () => {
    ddbMock.on(UpdateCommand).rejects(new Error("DB Error"));

    const event = [{ orderId: "ORDER-123" }];

    await expect(handler(event)).rejects.toThrow("DB Error");
  });
});
