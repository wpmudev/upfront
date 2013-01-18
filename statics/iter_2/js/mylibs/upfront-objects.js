(function () {

if (!Upfront || !Upfront.Application.LayoutEditor || !Upfront.Application.LayoutEditor.add_object) {
	Upfront.Util.log("Unable to add object");
	return false;
}

// These will be filterable!
var object_dependencies = [
	'../mylibs/objects/image',
	'../mylibs/objects/plain_text',
];
define(object_dependencies, function () {
	//Upfront.Util.log('loaded');
});

})();