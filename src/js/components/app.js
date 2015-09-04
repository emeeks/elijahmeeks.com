var React = require('react');
var AppActions = require("../actions/app-actions.js");
var AppStore = require("../stores/app-store.js");
var Api = require("../api/api.js");
var BioBox = require("../components/biobox.js");
var NavBox = require("../components/navbox.js");
var NavBar = require("../components/navbar.js");
var About = require("../components/about.js");
var ProjectList = require("../components/projectList.js");
var EssayList = require("../components/essayList.js");
var RepoList = require("../components/repoList.js");
var WorkshopList = require("../components/workshopList.js");
var Content = require("../components/content.js");
var Contact = require("../components/contact.js");
var Blog = require("../components/blog.js");
var Home = require("../components/home.js");
var DocMeta = require("react-doc-meta");

var _currentBlogPage = 0;
var _currentPage = "home";
var _currentContent = "none";


function getState() {
	var state = {
		navigationOptions: [
			{view: "home", label: "Home", twitterTitle: "Elijah Meeks - data visualization & rhetoric"},
			{view: "blog", label: "Blog", twitterTitle: "Elijah Meeks - blog"},
			{view: "essays", label: "Essays", twitterTitle: "Elijah Meeks - essays"},
			{view: "project-page", label: "Projects", twitterTitle: "Elijah Meeks - projects"},
			{view: "repos", label: "Code", twitterTitle: "Elijah Meeks - code"},
			{view: "about", label: "About", twitterTitle: "Elijah Meeks - about"},
			{view: "contact", label: "Contact", twitterTitle: "Elijah Meeks - contact"}
		],
		currentBlogPage: _currentBlogPage,
		currentContent: AppStore.getCurrentContent(),
		currentPage: AppStore.getCurrentView(),
		blogEntries: AppStore.getBlogList(),
		loadedBlogs: AppStore.getBlogs(),
		twitterCard: AppStore.getTwitterCard()
	}
	return state;
}

var APP =
	React.createClass({
		_onChange: function() {
        	this.setState(getState());
	    },
		componentDidMount: function() {
			Api.getBlogList();
	        AppStore.addChangeListener(this._onChange);
	    },
	    componentWillUnmount: function() {
	        AppStore.removeChangeListener(this._onChange);
	    },
	    changeCurrentBlogPage: function(amount) {
	    	_currentBlogPage += amount;
	    	this._onChange();
	    },
	    getInitialState: function() {
	        return getState();
	    },
	    changeCurrent: function(newView) {
			Api.setView(newView);
	    },
	    changeCurrentContent: function(newContent) {
			Api.setContent(newContent);
	    },
		render: function() {
			var _component = this;

			var pageTitle = "Elijah Meeks - data visualization & rhetoric";
			var thisNav = this.state.navigationOptions.filter(function (d) {return d.view == _component.state.currentPage})[0];

			if (thisNav != undefined) {
				var pageTitle = thisNav.twitterTitle;
			}

			var content = <div className="column8">React Man</div>
			var sidebar = <div className="column4"><BioBox /></div>
			var navbar = <div className="column12 txt-center"><NavBar changeView={this.changeCurrent} navOptions={this.state.navigationOptions} navCurrent={this.state.currentPage} /></div>;
			switch (this.state.currentPage) {
				case "about":
				content = <div className="column12"><About /></div>
				sidebar = <div className="column12 txt-center"></div>
				break;
				case "contact":
				content = <div className="column8"><Contact /></div>
				break;
				case "content":
				content = <div className="column6 prefix3"><Content markdown={this.state.currentContent} /></div>
				sidebar = <div className="column12 txt-center"></div>
				break;
				case "project-page":
				content = <div className="column12"><ProjectList changeContent={this.changeCurrentContent} /></div>
				sidebar = <div className="column12 txt-center"></div>
				break;
				case "essays":
				content = <div className="column8"><EssayList /></div>
				break;
				case "workshops":
				content = <div className="column8"><WorkshopList /></div>
				break;
				case "blog":
				var currentEntries = this.state.blogEntries;
				content = <div className="column8"><Blog currentBlogPage={this.state.currentBlogPage} loadedBlogs={this.state.loadedBlogs} entries={currentEntries} changeContent={this.changeCurrentContent} /></div>
				break;
				case "home":
				var currentEntries = this.state.blogEntries;
				content = <div className="column8"><Home currentBlogPage={this.state.currentBlogPage} loadedBlogs={this.state.loadedBlogs} entries={currentEntries} changeContent={this.changeCurrentContent} /></div>
				break;
				case "repos":
				content = <div className="column12"><RepoList /></div>
				sidebar = <div className="column12 txt-center"></div>
				break;
			}

			var tags = [
			      {name: "twitter:card", content: "summary"},
			      {name: "twitter:creator", content: "@elijah_meeks"},
			      {name: "twitter:title", content: pageTitle},
			      {name: "twitter:description", content: this.state.twitterCard.description},
			      {name: "twitter:image:src", content: this.state.twitterCard.image}
			];
			return (
				<div className="container">
				<DocMeta tags={tags} />
				<div className="column12 txt-center">
				<h1 className="cl-denim">Elijah Meeks</h1>
				<h3 style={{paddingTop: 0}} className="cl-denim-light">data visualization & rhetoric</h3>
				</div>
				{navbar}
				{sidebar}
				{content}
				<div style={{"margin": "30px 0", "paddingTop": "10px"}} className="column12 txt-center"><span style={{"borderTop": "1px solid #E4E4E4", "padding": "10px 40px", "color": "#444"}}>information wants to be free, but also elegant</span></div>
				</div>

				)
		}
	});

module.exports = APP;