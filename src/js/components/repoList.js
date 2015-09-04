var React = require('react');
var RepoStore = require('../constants/repo-list');

var RepoList =
	React.createClass({
		render: function() {
			var categoryCards = RepoStore.map(function (d,i) {
				var repoCards = d.repos.map(function(p,q) {
					return <div className="repo-card">
					<a target="_blank" href={p.link} >
					<h4>{p.label}</h4>
					<img src={"images/full/" + p.image} ></img><div>{p.description}</div></a></div>
				})
				return <div><h3>{d.label}</h3><div>{repoCards}</div></div>
			});
			return <div>
			<div>
			<p className="cl-denim-light">Some of my repositories:</p>
			</div>
			{categoryCards}
			</div>
		}
	});
module.exports = RepoList;