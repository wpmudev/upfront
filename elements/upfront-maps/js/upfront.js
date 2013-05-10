/* All changes to upfront which could potentially be integrated into the upfront core */
Upfront.Util.init_subview = function(mvObject, objectName){

	// init subviewModel
	var subviewModel = this.model.get('subviewModel');

	if(!(subviewModel instanceof Backbone.Model)){
		// when the view is rendered for the first time, subviewModel will be JSON (from the server)
		// subsequent renders will use the instantiated model.
		subviewModel = new mvObject.Model[objectName]( subviewModel );
	}

	this.model.set({"subviewModel": subviewModel}, {silent: true});

	this.subview = new mvObject.View[objectName]({model: subviewModel});

};