(function () {

var Util = {
	get_unique_id: function (pfx) {
		return _.template("{{prefix}}-{{stamp}}-{{numeric}}", {
			prefix: pfx || "entity",
			stamp: (new Date).getTime(),
			numeric: Math.floor((Math.random()*999)+1000)
		});
	},
};

define({
	"Util": Util
});

})();