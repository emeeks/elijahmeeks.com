var APP = require('./components/app');
var React = require('react');
var Api = require('./api/api');

window.onpopstate = function(event) {
	if (event.state && event.state.view) {
		Api.popState(event.state.view, event.state.content);
	}
};

if (window.location.hash.length > 3) {
	var hash = window.location.hash;
	var view = hash.split("#")[1];

	if (view.split("/")[0] == "content") {
		var content = "" + view + ".md";
		Api.setContent(content);
	}
	else {
		Api.setView(view);
	}
}
else {
    var urlOrigin = window.location.origin;
    var historyObject = {view: "home", content: "none"};
    var pageTitle = "elijahmeeks.com";
    window.history.pushState(historyObject, pageTitle, urlOrigin);
};

React.render(
	<APP />,
	document.getElementById('main')
	);