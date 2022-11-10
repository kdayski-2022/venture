const validMessages = [
]

const checkSetProjectTokenError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkSetProjectTokenError