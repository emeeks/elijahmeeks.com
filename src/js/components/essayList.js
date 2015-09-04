var React = require('react');
var EssayStore = require('../constants/essay-list');

var EssayList =
	React.createClass({
		render: function() {
			var cards = EssayStore.map(function (d,i) {
				return <div><a href={d.link}>{d.label}</a></div>
			});
			return <div>
			<div>
			<p className="cl-denim-light">A couple of the long-form essays I've written. Each is in four parts:</p>
			</div>
			{cards}
			</div>
		}
	});
module.exports = EssayList;