var d3 = require('d3');
var moment = require('moment');
var AppActions = require('../actions/app-actions.js');

var Api = {
	loadBlogs: function (arrayOfBlogs) {

		var total = arrayOfBlogs.length;
		var loaded = 0;
		var arrayLoaded = [];

		arrayOfBlogs.forEach(function (blog) {
			d3.text("content/blog/" + blog.path, function (data) {

				loaded++;
				arrayLoaded.push({path: blog.path, content: data});
				if (loaded == total) {
			        AppActions.receiveBlogs(arrayLoaded);
				}

			})
		})
	},
    popState: function (newView, newContent) {
        if (newView == "content") {
            AppActions.receiveContent(newContent);
        }
        else {
            AppActions.receiveView(newView);
        }
    },
    getBlogList: function () {
    	var entries = [];
    	d3.json("content/blogentries.json", function (data) {
    		for (var x in data) {
    			if (data.hasOwnProperty(x)) {
    				var splitLabel = data[x].split("_");
    				var blogdate = moment(splitLabel[0] + "-" + splitLabel[1] + "-" + splitLabel[2] + 'T12:00:00');
    				entries.push({date: blogdate, path: data[x]});
    			}
    		}
        AppActions.receiveBlogEntryList(entries);
    	});
    },
    setView: function (newView) {
        AppActions.receiveView(newView);
    },
    setContent: function (newContent) {
        AppActions.receiveContent(newContent);
    }
    }

module.exports = Api;