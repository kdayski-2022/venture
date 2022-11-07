const validMessages = [
]

const checkCalculatePercentageError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkCalculatePercentageError