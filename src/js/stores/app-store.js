var AppDispatcher = require('../dispatchers/app-dispatcher');
var AppConstants = require('../constants/app-constants.js');
var assign = require('object-assign');
var EventEmitter = require('events').EventEmitter;

var CHANGE_EVENT = "change";
var _entries = [];
var loadedBlogs = {};
var _content = "none";
var _view = "home";
var _twitterCard =  {title: "Elijah Meeks - data visualization & rhetoric",
			      description: "Text and code about data visualization.",
			      creator: "@elijah_meeks",
			      image: "http://elijahmeeks.com/images/full/fish.png"}

function updateHistory() {
    var urlOrigin = window.location.origin;
    var pageUrl = urlOrigin + "#" + _view;
    if (_view == "content") {
    	pageUrl = urlOrigin + "#" + _content.replace(".md", "");
    }
    if (_view == "home") {
    	var pageUrl = urlOrigin;
    }

    var historyObject = {view: _view, content: _content};

    var pageTitle = "elijahmeeks.com - " + _view;


    if (!window.history.state || window.history.state.view != _view || window.history.state.content != _content) {
		_gaq.push(['_trackEvent', 'content', _view, _content]);
        window.history.pushState(historyObject, pageTitle, pageUrl);
    }
}

function buildBlogHash(newBlogs) {
	newBlogs.forEach(function (blog) {
		loadedBlogs[blog.path] = blog.content;
	})
}

var AppStore = assign({}, EventEmitter.prototype, {
	emitChange: function() {
		this.emit(CHANGE_EVENT);
	},
	getTwitterCard: function() {
		return _twitterCard
	},
	addChangeListener: function(callback) {
		this.on(CHANGE_EVENT, callback);
	},
	removeChangeListener: function(callback) {
		this.removeListener(CHANGE_EVENT, callback);
	},
	getProjectList: function() {
		return _projectList
	},
	getBlogList: function() {
		return _entries
	},
	getBlogs: function() {
		return loadedBlogs;
	},
	getCurrentContent: function() {
		return _content
	},
	getCurrentView: function() {
		return _view
	},
	dispatcherIndex: AppDispatcher.register(function(payload) {
		var action = payload.action;
		switch(action.actionType) {
			case AppConstants.RECEIVE_ENTRIES:
			_entries = payload.action.entries;
			break;
			case AppConstants.RECEIVE_BLOGS:
			buildBlogHash(payload.action.blogs);
			break;
			case AppConstants.RECEIVE_STATE:
			buildBlogHash(payload.action.blogs);
			break;
			case AppConstants.RECEIVE_VIEW:
			_view = payload.action.view;
			_content = "none";
			updateHistory();
			break;
			case AppConstants.RECEIVE_CONTENT:
			_view = "content";
			_content = payload.action.content;
			updateHistory();
			break;
		}
		AppStore.emitChange();

		return true;
	})
})

module.exports = AppStore;