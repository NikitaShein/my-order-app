import { handler } from "../lambdas/cancelOrder";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);

describe("cancelOrder handler", () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.ORDERS_TABLE = "TestTable";
  });

  it("should set status to CANCELLED for object input", async () => {
    ddbMock.on(UpdateCommand).resolves({});
    const result = (await handler({ orderId: "ORDER-123" })) as any;
    expect(result.finalStatus).toBe("CANCELLED");
  });

  it("should set status to CANCELLED for array input", async () => {
    ddbMock.on(UpdateCommand).resolves({});
    const result = (await handler([{ orderId: "ORDER-123" }])) as any;
    expect(result.finalStatus).toBe("CANCELLED");
  });

  it("should not overwrite payment/shipping statuses", async () => {
    ddbMock.on(UpdateCommand).resolves({});
    await handler({ orderId: "ORDER-123" });
    const updateCall = ddbMock.call(0).args[0] as UpdateCommand;
    expect(updateCall.input.UpdateExpression).not.toContain("paymentStatus");
    expect(updateCall.input.UpdateExpression).not.toContain("shippingStatus");
  });
});
