const Chatbot = require('darwin-sdk').Chatbot
const Query = require('darwin-sdk').Query
const OpenSkillEvent = require('darwin-sdk').OpenSkillEvent
const Response = require('darwin-sdk').Response
const config = require('../config')
const logger = require('../utils/logger').logger('bot')

const index = async (ctx, next) => {
    await ctx.render('index.html');
};

const getAgentBySkillName = (skillName) => {
    return config.agents[skillName]
}

const mapUrlToResourceId = (url) => {
    return ""
}

const getReplyActions = (instructs) => {
    const actions = []
    for (let instruct of instructs) {
        if (instruct.type === 'play-audio') {
            actions.push({ name: "audioPlayGenieSource", properties: {audioGenieId : mapUrlToResourceId(instruct.url)}})
        }
    }
    return actions  
}

const buildResponseBy = (chatbotRsp, getBaseResponse) => {
    const response = getBaseResponse()
    if (chatbotRsp.getInstructs()) {
        const actions = getReplyActions(chatbotRsp.getInstructs())
        if (actions) response.returnValue.actions = actions
    }
    return response      
}

const getContinueResponse = (intentId, chatbotRsp) => {
    return buildResponseBy(chatbotRsp, () => {
        return {
            returnCode: "0",
            returnErrorSolution: "",
            returnMessage: "",
            returnValue: {
                reply: chatbotRsp.getReply(),
                resultType: "ASK_INF",
                askedInfos:[
                    {
                        parameterName : "any",
                        intentId : intentId
                    }
                ],
                properties: {},
                executeCode: "SUCCESS",
                msgInfo: ""
            }
        }         
    })   
}

const getFinalResponse = (code, chatbotRsp) => {
    return buildResponseBy(chatbotRsp, () => {
        return {
            returnCode: "0",
            returnErrorSolution: "",
            returnMessage: "",
            returnValue: {
                reply: chatbotRsp ? chatbotRsp.getReply() : "",
                resultType: "RESULT",
                properties: {},
                executeCode: code,
                msgInfo: ""
            }
        }
    })
}

const getFailResponse = () => {
    return getFinalResponse("PARAMS_ERROR")
}

const isOpenApp = (request) => {
    return request.slotEntities.length === 0
}

const buildQueryBy = (request) => {
    const sessionId = request.sessionId
    const tocken = request.token
    const aligenieId = request.requestData.SYMBOL_tbUserId
    const userId = aligenieId ? aligenieId : sessionId
    const query = isOpenApp(request) ? new OpenSkillEvent(userId) : new Query(userId, request.utterance)
    if (tocken) query.setAccessTocken(tocken)
    return query
}

const getChatbotResponse = async (request) => {
    const agent = getAgentBySkillName(request.skillName)

    const chatbot = new Chatbot(config.chatbot_url, agent, config.source)
    const query = buildQueryBy(request)
    const rsp = await chatbot.dispose(query)
    return rsp.hasInstructOfQuit() ? getFinalResponse('SUCCESS', rsp) : getContinueResponse(request.intentId, rsp)
}

const postQuery = async (ctx, next) => {
    const request = ctx.request.body
    logger.debug(`receive : ${JSON.stringify(request)}`)
    let response = null
    try {
        const agent = getAgentBySkillName(request.skillName)
        response = agent ? await getChatbotResponse(request) : getFailResponse()
    } catch (err) {
        if (err) { 
            logger.error(JSON.stringify(err)) 
            logger.error(JSON.stringify(err.stack))
        } else {
            logger.error('chatbot has no reply!!!')
        }
        response = getFailResponse()
    }
    logger.debug(`reply : ${JSON.stringify(response)}`)
    ctx.response.type = "application/json"
    ctx.response.status = 200
    ctx.response.body = response
};

module.exports = {
    'GET /': index,
    'POST /': postQuery
};
