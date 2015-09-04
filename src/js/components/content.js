var React = require('react');
var Remarkable = require('remarkable');
var d3 = require('d3');

function renderContent(markdown, thisNode) {
	var rm = new Remarkable({html: true});
	renderedContent = rm.render(markdown);
	d3.select(thisNode).html(renderedContent);
}
var Content =
	React.createClass({
		render: function() {
			return <div className="content">Here's some content. It's awesome.</div>
		},
		componentDidMount: function() {
			var _component = this;
			var thisNode = React.findDOMNode(this);
			d3.text(this.props.markdown, function (data) {
				renderContent(data, thisNode);
			})
		}
	});
module.exports = Content;