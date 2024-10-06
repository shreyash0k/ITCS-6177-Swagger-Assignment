export const handler = async (event) => {
    const keyword = event.queryStringParameters.keyword;
    const responseMessage = `Shreyash says ${keyword}`;
    return {
        statusCode: 200,
        body: JSON.stringify({ message: responseMessage }),
    };
};

