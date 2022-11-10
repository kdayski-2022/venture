const checkInitializeError = require('./methods/initialize')
const checkStopFundraisingError = require('./methods/stopFundraising')
const checkContributeError = require('./methods/contribute')
const checkDistributeProjectTokenError = require('./methods/distributeProjectToken')
const checkSetCapAmountError = require('./methods/setCapAmount')
const checkSetProjectTokenPriceError = require('./methods/setProjectTokenPrice')
const checkCalculatePercentageError = require('./methods/calculatePercentage')
const checkCalculateNeedProjectTokensError = require('./methods/calculateNeedProjectTokens')
const checkCalculateSuccessFeeAmountTokenForType2Error = require('./methods/calculateSuccessFeeAmountTokenForType2')
const checkGetContributeLengthError = require('./methods/getContributeLength')
const checkGetContributeError = require('./methods/getContribute')
const checkGetContributesError = require('./methods/getContributes')
const checkAddPrivelegedUsersError = require('./methods/addPrivelegedUsers')
const checkRemovePrivelegedUsersError = require('./methods/removePrivelegedUsers')
const checkSetProjectTokenError = require('./methods/setProjectToken')
const checkAddAcceptableTokenError = require('./methods/addAcceptableToken')
const checkRemoveAcceptableTokenError = require('./methods/removeAcceptableToken')

const validMethods = [
	"initialize",
	"contribute",
	"stopFundraising",
	"distributeProjectToken",
	"setCapAmount",
	"setProjectTokenPrice",
	"calculatePercentage",
	"calculateNeedProjectTokens",
	"calculateSuccessFeeAmountTokenForType2",
	"getContributeLength",
	"getContribute",
	"getContributes",
	"addPrivelegedUsers",
	"removePrivelegedUsers",
	"setProjectToken",
	"addAcceptableToken",
	"removeAcceptableToken"
]

const checkVentureMethodError = (method, error) => {
	expect(validMethods).toContain(method);
	switch (method) {
		case "initialize":
			checkInitializeError(error)
			break;
		case "contribute":
			checkContributeError(error)
			break;
		case "stopFundraising":
			checkStopFundraisingError(error)
			break;
		case "distributeProjectToken":
			checkDistributeProjectTokenError(error)
			break;
		case "setCapAmount":
			checkSetCapAmountError(error)
			break;
		case "setProjectTokenPrice":
			checkSetProjectTokenPriceError(error)
			break;
		case "calculatePercentage":
			checkCalculatePercentageError(error)
			break;
		case "calculateNeedProjectTokens":
			checkCalculateNeedProjectTokensError(error)
			break;
		case "calculateSuccessFeeAmountTokenForType2":
			checkCalculateSuccessFeeAmountTokenForType2Error(error)
			break;
		case "getContributeLength":
			checkGetContributeLengthError(error)
			break;
		case "getContribute":
			checkGetContributeError(error)
			break;
		case "getContributes":
			checkGetContributesError(error)
			break;
		case "addPrivelegedUsers":
			checkAddPrivelegedUsersError(error)
			break;
		case "removePrivelegedUsers":
			checkRemovePrivelegedUsersError(error)
			break;
		case "setProjectToken":
			checkSetProjectTokenError(error)
			break;
		case "addAcceptableToken":
			checkAddAcceptableTokenError(error)
			break;
		case "removeAcceptableToken":
			checkRemoveAcceptableTokenError(error)
			break;
	}
}

module.exports = checkVentureMethodError