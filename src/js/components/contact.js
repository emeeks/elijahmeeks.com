var React = require('react');

var Contact =
	React.createClass({
		render: function() {
			return <div>
			<p>Twitter tends to work well, LinkedIn not so much. If you want to send me an email about interesting data visualization theories, you can at <a href="mailto:elijahmeeks@gmail.com">elijahmeeks@gmail.com</a>.</p>
			<p>If you're interested in hiring me for consulting or teaching a workshop, you should get ahold of me at <a href="mailto:elijah@ambergris-consulting.com">elijah@ambergris-consulting.com</a>.</p>
			</div>
		}
	});
module.exports = Contact;