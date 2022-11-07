const validMessages = [
	"VM Exception while processing transaction: reverted with reason string 'LIST FULL'",
	"VM Exception while processing transaction: reverted with reason string 'ALREADY ADDED'",
]

const checkAddAcceptableTokenError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkAddAcceptableTokenError