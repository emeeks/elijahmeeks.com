var React = require('react');

var NavBar =
	React.createClass({
		render: function() {
			var _component = this;
			var options = this.props.navOptions.map(function (d) {
				var option = <a key={"option" + d.label} onClick={function() {_component.props.changeView(d.view)}}>{d.label}</a>
				if (_component.props.navCurrent == d.view) {
					option = <a className="currentView" key={"option" + d.label}>{d.label}</a>
				}
				return option
			});

			return <div className="nav">
			{options}
			</div>
		}
	});
module.exports = NavBar;