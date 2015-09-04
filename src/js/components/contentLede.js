var React = require('react');
var Remarkable = require('remarkable');
var d3 = require('d3');

function renderContent(markdown, entryDate, paragraphs, changeContent, contentPath) {
	var rm = new Remarkable({html: true});
	renderedContent = rm.render(markdown);

	var title = "";

	console.log(renderedContent);

	if (renderedContent.split("<h1>")[1]) {
		title = renderedContent.split("<h1>")[1].split("</h1>")[0];
	}

	var paras = [];

	for (var x = 1; x<=paragraphs;x++) {
		if (renderedContent.split("<p>")[x]) {
			var aPara = renderedContent.split("<p>")[x].split("</p>")[0];
			paras.push(<p>{aPara}</p>)
		}
	}

	return <div><h3><a className="read-more" onClick={function() {changeContent("content/blog/"+contentPath)}}>{title}</a></h3><span>{entryDate}</span>{paras}<span><a className="read-more" onClick={function() {changeContent("content/blog/"+contentPath)}}>Full post</a></span></div>
}
var ContentLede =
	React.createClass({
		render: function() {
			console.log(this.props)
			var content = renderContent(this.props.markdown, this.props.entryDate, this.props.paragraphs, this.props.changeContent, this.props.contentPath);
			return <div>{content}</div>
		}
	});
module.exports = ContentLede;