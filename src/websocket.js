const AWS = require('aws-sdk');
const apig = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.APIG_ENDPOINT
});
const dynamodb = new AWS.DynamoDB.DocumentClient();

const connectionTable = process.env.CONNECTIONS_TABLE;

exports.handler =  async function(event, context) {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));
  const { body, requestContext: { connectionId, routeKey }} = event;
  switch(routeKey) {
    case '$connect':
      await dynamodb.put({
        TableName: connectionTable,
        Item: {
          connectionId,
          // Automatically expire the connection an hour later. This is
          // optional, but recommended. You will have to decide how often to
          // time out and/or refresh the ttl.
          ttl: parseInt((Date.now() / 1000) + 3600)
        }
      }).promise();
      break;

    case '$disconnect':
      await dynamodb.delete({
        TableName: connectionTable,
        Key: { connectionId }
      }).promise();
      break;

    default:
      await apig.postToConnection({
        ConnectionId: connectionId,
        Data: body
      }).promise();
  }

  // A 200 status tells API Gateway the message was received successfully, and
  // API Gateway lets the client know as well.
  return { statusCode: 200 };
}
