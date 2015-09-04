var React = require('react');

var RSSButton =
	React.createClass({
		render: function() {
			return <div className="rss" style={{textAlign: "right"}}><a rel="alternate" type="application/rss+xml" title="elijahmeeks.com RSS feed" href="http://elijahmeeks.com/rss.xml"><img style={{width:"30px"}} src="images/icons/rss.png"></img></a></div>
		}
	});
module.exports = RSSButton;