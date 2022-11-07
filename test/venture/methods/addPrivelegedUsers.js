const validMessages = [
]

const checkAddPrivelegedUsersError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkAddPrivelegedUsersError