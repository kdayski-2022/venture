const validMessages = [
]

const checkGetContributesError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkGetContributesError