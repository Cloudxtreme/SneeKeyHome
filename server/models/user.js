module.exports = function (bookshelf) {
	return bookshelf.extend({
		tableName: 'user',
		hasTimestamps: true
	});
};