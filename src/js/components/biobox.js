var React = require('react');

var BioBox =
	React.createClass({
		render: function() {
			return <div>
			<p>Elijah Meeks is a data visualization practitioner in Silicon Valley.</p>
            <iframe style={{height:"20px"}} src="//platform.twitter.com/widgets/follow_button.html?screen_name=Elijah_Meeks&show_count=false&show_screen_name=true" scrolling="no" frameborder="0" allowTransparency="true" />
			<hr></hr>
			<p style={{textAlign: "center"}}><iframe style={{"width": "120px", "height": "240px"}} marginWidth="0" marginHeight="0" scrolling="no" frameBorder="0" src="//ws-na.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&OneJS=1&Operation=GetAdHtml&MarketPlace=US&source=ac&ref=qf_sp_asin_til&ad_type=product_link&tracking_id=elijmeek-20&marketplace=amazon&region=US&placement=1617292117&asins=1617292117&linkId=VDTGFUJV2PW32E5X&show_border=true&link_opens_in_new_window=true&price_color=4E7091&title_color=30465C&bg_color=FFFFFF"></iframe></p>
			<hr></hr>
			<h4>Upcoming Workshops</h4>
			<p><a target="_blank" href="http://forwardjs.com">Network Visualization with D3 at ForwardJS on July 27th</a></p>
			<hr></hr>
			<h4>Profiles</h4>
			<p><a target="_blank" href="https://twitter.com/Elijah_Meeks">@Elijah_Meeks on Twitter</a></p>
			<p><a target="_blank" href="http://bl.ocks.org/emeeks">Small code examples on bl.ocks.org</a></p>
			<p><a target="_blank" href="https://github.com/emeeks">emeeks on GitHub</a></p>
			<p><a target="_blank" href="http://stackoverflow.com/users/1350344/elijah">StackOverflow Profile</a></p>
			<p><a target="_blank" href="https://www.linkedin.com/profile/view?id=357371247">LinkedIn Profile</a></p>
			</div>
		}
	});
module.exports = BioBox;