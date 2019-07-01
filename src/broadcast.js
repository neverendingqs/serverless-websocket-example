const AWS = require('aws-sdk');
const apig = new AWS.ApiGatewayManagementApi({
  endpoint: process.env.APIG_ENDPOINT
});
const dynamodb = new AWS.DynamoDB.DocumentClient();

const connectionTable = process.env.CONNECTIONS_TABLE;

async function sendMessage(connectionId, body) {
  try {
    await apig.postToConnection({
      ConnectionId: connectionId,
      Data: body
    }).promise();
  } catch (err) {
    // Ignore if connection no longer exists
    if(err.statusCode !== 400 && err.statusCode !== 410) {
      throw err;
    }
  }
}

async function getAllConnections(ExclusiveStartKey) {
  const { Items, LastEvaluatedKey } = await dynamodb.scan({
    TableName: connectionTable,
    AttributesToGet: [ 'connectionId' ],
    ExclusiveStartKey
  }).promise();

  const connections = Items.map(({ connectionId }) => connectionId);
  if(LastEvaluatedKey) {
    connections.push(...await getAllConnections(LastEvaluatedKey));
  }

  return connections;
}

exports.handler = async function(event, context) {
  // For debug purposes only.
  // You should not log any sensitive information in production.
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

  const { body } = event;
  const connections = await getAllConnections();
  await Promise.all(
    connections.map(connectionId => sendMessage(connectionId, body))
  );
}
