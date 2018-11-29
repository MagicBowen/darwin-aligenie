var index = async (ctx, next) => {
    await ctx.render('index.html');
};

var postQuery = async (ctx, next) => {
    const request = ctx.request.body
    const query = request.utterance
    console.log(JSON.stringify(request))
    ctx.response.type = "application/json";
    ctx.response.status = 200;
    ctx.response.body = {
    "returnCode": "0",
    "returnErrorSolution": "",
    "returnMessage": "",
    "returnValue": {
        "reply": "你好，欢迎进入课程表，功能正在开发中，请稍后...",
        "resultType": "ASK_INF",
        "askedInfos":[
            {
                "parameterName" : "any",
                "intentId" : "default"
            }
        ],
        "properties": {},
        "executeCode": "SUCCESS",
        "msgInfo": ""
    }
}  
};

module.exports = {
    'GET /': index,
    'POST /': postQuery
};
