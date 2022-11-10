const validMessages = [
	"VM Exception while processing transaction: reverted with reason string 'NOT YET LOCKED'",
	"VM Exception while processing transaction: reverted with reason string 'NOT SET PROJECT TOKEN'",
	"VM Exception while processing transaction: reverted with reason string 'NOT HAVE ALLOWED TOKENS AMOUNT'",
]

const checkDistributeProjectTokenError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkDistributeProjectTokenError