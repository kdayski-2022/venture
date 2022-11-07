const validMessages = [
	"VM Exception while processing transaction: reverted with reason string 'ERROR_TOKEN_NOT_ADDED'",
]

const checkRemoveAcceptableTokenError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkRemoveAcceptableTokenError