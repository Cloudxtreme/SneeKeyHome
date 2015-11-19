module.exports = function (bookshelf) {
	return bookshelf.extend({
		tableName: 'session',
		hasTimestamps: true
	});
};