var React = require('react');

var workshopListStore = [{label: "Creating Effective Network Visualizations with D3.js", location: "ForwardJS", date: "2015-07-27", description: "Sankeys, force-directeds, colas, matrices, arc diagrams.", link: "http://forwardjs.com/"}];

var WorkshopList =
	React.createClass({
		render: function() {
			//todo automatically detect past and future workshops based on date
			var workshops = workshopListStore.map(function (d) {
				return <span>{d.label} - {d.location} - {d.date} <a className="read-more" target="_blank" href={d.link}>Register</a></span>
			})
			return <div>
			<h3>Upcoming</h3>
			{workshops}
			</div>
		}
	});
module.exports = WorkshopList;