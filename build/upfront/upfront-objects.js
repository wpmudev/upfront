(function () {

if (!Upfront || !Upfront.Application.LayoutEditor || !Upfront.Application.LayoutEditor.add_object) {
	Upfront.Util.log("Unable to add object");
	return false;
}

// These will be filterable!
var object_dependencies = [
	'upfront/objects/loading',
	'upfront/objects/image',
	'upfront/objects/plain_text',
	'upfront/objects/setting_example'
];
define(object_dependencies, function () {
	//Upfront.Util.log('loaded');
});

})();