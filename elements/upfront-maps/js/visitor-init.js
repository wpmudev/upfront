/* 
Initialises the visitor version of the model/views (with no edit-in-place functionality). 
To determine which views are rendered, an object is passed from PHP to JS indicating which uf-objects are currently used/displayed.
*/
require.config({
	paths:{
		'm-map': upfrontMap.pluginPath
	}
});

/* Use mustache style templates */
_.templateSettings = {
	evaluate : /\{\[([\s\S]+?)\]\}/g,
	interpolate : /\{\{([\s\S]+?)\}\}/g
};

(function ($) {
require(['m-map/mv'], function() {

	if(_.isObject(mapModels)){

		_.each(mapModels, function(model, model_name){
			_.each(model, function(data){
				
				var instantiatedModel = new Ufmap.Model[model_name](data.model);

				var instantiatedView = new Ufmap.View[model_name]({
					el: $('#vt-'+data.elementId),
					model: instantiatedModel
				});
				
				instantiatedView.render();
			});
			
		});
	}
});
})(jQuery);