const validMessages = [
]

const checkCalculateNeedProjectTokensError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkCalculateNeedProjectTokensError