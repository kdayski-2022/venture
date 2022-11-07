const validMessages = [
]

const checkRemovePrivelegedUsersError = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkRemovePrivelegedUsersError