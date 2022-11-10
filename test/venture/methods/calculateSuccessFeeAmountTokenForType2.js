const validMessages = [
]

const checkCalculateSuccessFeeAmountTokenForType2Error = (error) => {
	expect(validMessages).toContain(error.message);
}

module.exports = checkCalculateSuccessFeeAmountTokenForType2Error