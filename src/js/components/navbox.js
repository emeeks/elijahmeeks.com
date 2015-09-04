var React = require('react');

var NavBox =
	React.createClass({
		render: function() {
			var _component = this;
		var options = this.props.navOptions.map(function (d) {
			var option = <li><button key={"option" + d.label} className="btn" onClick={function() {_component.props.changeView(d.view)}}>{d.label}</button></li>
			if (_component.props.navCurrent == d.view) {
				option = <li><button key={"option" + d.label} className="btn-selected">{d.label}</button></li>
			}
			return option
		});

			return <div>
			<ol className="nonumber">
			<li>Sections</li>
			{options}
			</ol>
			</div>
		}
	});
module.exports = NavBox;