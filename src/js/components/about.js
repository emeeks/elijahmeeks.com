var React = require('react');

var About =
	React.createClass({
		render: function() {
			return <div>
			<p>Elijah Meeks is a senior data visualization engineer at Netflix where he helps understand how people experience Netflix.</p>
			<p>He is a principal at <a target="_blank" href="http://ambergris-consulting.com/">Ambergris Consulting</a> where he provides data visualization strategy and workshops, a contributor to <a href="http://www.firstdraftpodcast.com/" target="_blank">The First Draft Podcast</a>, which covers science, technology and the academy, is on the UC Berkeley Extension Data Science Advisory Board and is the author of <a target="_blank" href="http://www.amazon.com/gp/product/1617292117/">D3.js in Action</a>.</p>
			<p>Previously, he worked at the Stanford University Library, where he developed interactive scholarly works.</p>
			<p>This site is built with React using Susie Lu's <a href="https://github.com/susielu/minimal-ui" target="_blank">minimal UI.</a></p>
			</div>
		}
	});
module.exports = About;