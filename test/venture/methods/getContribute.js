const validMessages = [
]

const checkGetContributeError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkGetContributeError