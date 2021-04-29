/* eslint-disable @typescript-eslint/require-await */
import {APIGatewayProxyResultV2, SNSEvent} from 'aws-lambda';

export async function main(event: SNSEvent): Promise<APIGatewayProxyResultV2> {
  // console.log('event 👉', JSON.stringify(event, null, 2));

  // throw new Error('throwing an error 💥');

  const records = event.Records.map(record => {
    const {Message, Subject, Type} = record.Sns;

    return {subject: Subject, message: Message, type: Type};
  });

  console.log('records: 👉', JSON.stringify(records, null, 2));

  return {
    body: JSON.stringify({records}),
    statusCode: 2000,
  };
}
