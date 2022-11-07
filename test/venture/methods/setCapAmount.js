const validMessages = [
]

const checkSetCapAmountError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkSetCapAmountError