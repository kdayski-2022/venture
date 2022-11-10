const validMessages = [
]

const checkInitializeError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkInitializeError