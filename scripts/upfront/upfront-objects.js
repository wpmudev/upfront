(function () {

// These will be filterable!
define([
	'upfront/objects/loading'
	//'upfront/objects/image',
	//'upfront/objects/plain_text',
	//'upfront/objects/setting_example',
	//'upfront/objects/test_resize'
], function () {
  if (!Upfront || !Upfront.Application.LayoutEditor || !Upfront.Application.LayoutEditor.add_object) {
    Upfront.Util.log("Unable to add object");
    return false;
  }
	//Upfront.Util.log('loaded');
});

})();
