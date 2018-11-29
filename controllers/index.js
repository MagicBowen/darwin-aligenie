const Chatbot = require('darwin-sdk').Chatbot
const Query = require('darwin-sdk').Query
const OpenSkillEvent = require('darwin-sdk').OpenSkillEvent
const Response = require('darwin-sdk').Response
const config = require('../config')

const index = async (ctx, next) => {
    await ctx.render('index.html');
};

const getAgentBySkillName = (skillName) => {
    return config.agents[skillName]
}

const getContinueResponse = (intentId, response) => {
    return {
        "returnCode": "0",
        "returnErrorSolution": "",
        "returnMessage": "",
        "returnValue": {
            "reply": response.getReply(),
            "resultType": "ASK_INF",
            "askedInfos":[
                {
                    "parameterName" : "any",
                    "intentId" : intentId
                }
            ],
            "properties": {},
            "executeCode": "SUCCESS",
            "msgInfo": ""
        }
    } 
}

const getFinalResponse = (code, response) => {
    return {
        "returnCode": "0",
        "returnErrorSolution": "",
        "returnMessage": "",
        "returnValue": {
            "reply": response.getReply(),
            "resultType": "RESULT",
            "properties": {},
            "executeCode": code,
            "msgInfo": ""
        }
    }
}

const getFailResponse = () => {
    return getFinalResponse("PARAMS_ERROR", "请求发生错误，请稍后重试，谢谢！")
}

const isOpenApp = (request) => {
    return request.slotEntities.length === 0
}

const buildQueryBy = (request) => {
    const sessionId = request.sessionId
    const tocken = request.token
    const query = isOpenApp(request) ? new OpenSkillEvent(sessionId) : new Query(sessionId, request.utterance)
    if (tocken) query.setAccessTocken(tocken)
    return query
}

const getChatbotResponse = (request) => {
    const agent = getAgentBySkillName(request.skillName)

    const chatbot = new Chatbot(config.chatbot_url, agent, config.source)
    const query = buildQueryBy(request)
    const rsp = chatbot.dispose(query)
    return rsp.hasInstructOfQuit() ? getFinalResponse('SUCCESS', rsp) : getContinueResponse(request.intentId, rsp)
}

const postQuery = async (ctx, next) => {
    const request = ctx.request.body
    const agent = getAgentBySkillName(request.skillName)
    const response = agent ? getChatbotResponse(request) : getFailResponse()
    ctx.response.type = "application/json"
    ctx.response.status = 200
    ctx.response.body = response
};

module.exports = {
    'GET /': index,
    'POST /': postQuery
};
