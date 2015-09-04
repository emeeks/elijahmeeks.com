var React = require('react');
var Content = require('../components/content');
var ContentLede = require('../components/contentLede');
var RSSButton = require('../components/rss');
var Api = require('../api/api');
var ProjectStore = require('../constants/project-list');
var d3 = require('d3-svg-ribbon');

function mapAnEntry(entry, _component) {
	var date = entry.date.fromNow();
	return <div>
	<ContentLede contentPath={entry.path} changeContent={_component.props.changeContent} paragraphs={3} entryDate={date} markdown={_component.props.loadedBlogs[entry.path]} />
	</div>
}

var Home =
	React.createClass({
		render: function() {
			console.log("DAMN", d3);

			var _component = this;
			var loadedLedes = [];
			var ledesToBeLoaded = [];
			_component.props.entries.forEach(function (d) {
				if (_component.props.loadedBlogs[d.path] !== undefined) {
					loadedLedes.push(d);
				}
				else {
					ledesToBeLoaded.push(d);
				}
			});

			if (ledesToBeLoaded.length > 0) {
				Api.loadBlogs(ledesToBeLoaded);
			}

			var entryLedes = loadedLedes
			.sort(function (a,b) {
				if (a.date.unix() < b.date.unix()) {
					return 1
				}
				if (a.date.unix() > b.date.unix()) {
					return -1
				}
				return 1
			}).filter(function(d,i) {return i == 0}).map(function (d) {return mapAnEntry(d,_component)});

			return <div>
			<RSSButton />
			{entryLedes}
			</div>
		}
	});
module.exports = Home;