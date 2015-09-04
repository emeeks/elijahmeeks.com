var AppConstants = require('../constants/app-constants.js');
var AppDispatcher = require('../dispatchers/app-dispatcher.js');

var AppActions = {
	receiveBlogEntryList:function(entries){
		AppDispatcher.handleViewAction({
			actionType: AppConstants.RECEIVE_ENTRIES,
			entries: entries
		})
	},
	receiveBlogs:function(blogs){
		AppDispatcher.handleViewAction({
			actionType: AppConstants.RECEIVE_BLOGS,
			blogs: blogs
		})
	},
	receiveNewState: function(newState) {
		AppDispatcher.handleViewAction({
			actionType: AppConstants.RECEIVE_STATE,
			state: state
		})
	},
	receiveView: function (newView) {
		AppDispatcher.handleViewAction({
			actionType: AppConstants.RECEIVE_VIEW,
			view: newView
		})
	},
	receiveContent: function (newContent) {
		AppDispatcher.handleViewAction({
			actionType: AppConstants.RECEIVE_CONTENT,
			content: newContent
		})
	}
}

module.exports = AppActions;