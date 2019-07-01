function createAuthorizedResponse(resource) {
  return {
    principalId: 'me',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: 'Allow',
        Resource: resource
      }]
    }
  };
}

function createUnauthorizedResponse() {
  return 'Unauthorized';
}

exports.handler = async function(event, context) {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));

  const { headers, methodArn } = event;

  // This is for demo purposes only.
  // This check is probably not valuable in production.
  if(headers['X-Forwarded-Proto'] === 'https') {
    return createAuthorizedResponse(methodArn);
  } else {
    return createUnauthorizedResponse();
  }
}
