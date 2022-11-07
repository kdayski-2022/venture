const validMessages = [
]

const checkSetProjectTokenPriceError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkSetProjectTokenPriceError