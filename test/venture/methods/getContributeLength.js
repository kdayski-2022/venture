const validMessages = [
]

const checkGetContributeLengthError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkGetContributeLengthError