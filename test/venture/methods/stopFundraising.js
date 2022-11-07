const validMessages = [
	"VM Exception while processing transaction: reverted with reason string 'LOCKED'"
]

const checkStopFundraisingError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkStopFundraisingError