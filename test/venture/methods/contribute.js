const validMessages = [
	"VM Exception while processing transaction: reverted with reason string 'ZERO TOKEN AMOUNT'",
	"VM Exception while processing transaction: reverted with reason string 'LOCKED'",
	"VM Exception while processing transaction: reverted with reason string 'BAD CONTRIBUTE TOKEN'",
	"VM Exception while processing transaction: reverted with reason string 'NOT HAVE ALLOWED TOKENS AMOUNT'",
	"VM Exception while processing transaction: reverted with reason string 'MIN AMOUNT FOR PRIVELEGED USER'",
	"VM Exception while processing transaction: reverted with reason string 'MAX AMOUNT FOR PRIVELEGED USER'",
	"VM Exception while processing transaction: reverted with reason string 'MIN AMOUNT FOR USER'",
	"VM Exception while processing transaction: reverted with reason string 'MAX AMOUNT FOR USER'"
]

const checkContributeError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkContributeError