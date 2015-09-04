var React = require('react');
var ProjectStore = require('../constants/project-list');

var ProjectList =
	React.createClass({
		render: function() {
			var _component = this;
			var cards = ProjectStore.map(function (d,i) {
				var cardTags = d.tags.map(function(p,q) {return <span key={"project_tag" +i+q} className="tag">{p}</span>});
				var moreInfo = <div></div>
				var mappedLinks = d.links.map(function (p) {return <div><a href={p.link}>{p.label}</a></div>});
				moreInfo = <div className="project-moreinfo"><a className="read-more" onClick={function() {_component.props.changeContent("content/project/" + d.contentFile)}}>Read more...</a><div className="project-tags">{cardTags}</div>{mappedLinks}</div>
				return <div key={"project_card"+i} className="project-container"><img onClick={function() {_component.props.changeContent("content/project/" + d.contentFile)}} src={"images/thumbs/" + d.image}></img><div className="project-name"><h3>{d.label}</h3></div><span className="project-description">{d.description}</span>{moreInfo}</div>
			});
			return <div>
			<div>
			<p className="cl-denim-light">Below are a few of the projects that I've contributed to over the last few years. Nearly every project here was part of a collaborative effort, involving scholars and other developers. In many cases, I've written up more detailed descriptions of my work elsewhere. Click on a project to read a short overview and see links to the project or related material.</p>
			</div>
			{cards}
			</div>
		}
	});
module.exports = ProjectList;