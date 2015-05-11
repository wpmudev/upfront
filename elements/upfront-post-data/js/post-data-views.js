(function ($) {
define([
	'text!elements/upfront-post-data/tpl/views.html'
], function(tpl) {

var l10n = Upfront.Settings.l10n.post_data_element;
var $template = $(tpl);

var Views = {
	
	DEFAULT: 'post_data',

	_view: Backbone.View.extend({

		render: function () {
			var me = this,
				model = Upfront.Util.model_to_json(this.model),
				props = model.properties || {},
				objects = model.objects || {},
				post_id = 0
			;
			if ( _upfront_post_data.post_id )
				post_id = _upfront_post_data.post_id;
			console.log('rendering view', post_id);
			this._post_data_load = Upfront.Util
				.post({
					action: "upfront_post-data-load",
					data: {
						props: props,
						objects: objects,
						post_id: post_id
					}
				})
				.success(function (response) {
					console.log(response.data)
					if (response.data && response.data.post_data) {
						me.model.get('objects').each(function(object){
							var view = Upfront.data.object_views[object.cid],
								type = object.get_property_value_by_name('part_type');
							if ( !view || !type || !response.data.post_data[type] )
								return;
							view.render_view(response.data.post_data[type]);
						});
						me.$el.empty();
					}
					else me.$el.empty().append(me.tpl.error({l10n: l10n}));
				})
				.error(function () {
					me.$el.empty().append(me.tpl.error({l10n: l10n}));
				})
			;
			this.$el.empty().append(this.tpl.load({l10n: l10n}));
		},
		
		tpl: {
			main: _.template($template.filter("#post-data").html()),
			error: _.template($template.filter("#error").html()),
			load: _.template($template.filter("#loading").html())
		}
	}),

};

Views.post_data = Views._view.extend({
	className: 'upfront_post-data-post_data'
});

Views.author = Views._view.extend({
	className: 'upfront_post-data-author'
});

Views.taxonomy = Views._view.extend({
	className: 'upfront_post-data-taxonomy'
});

Views.featured_image = Views._view.extend({
	className: 'upfront_post-data-featured_image'
});

Views.comments = Views._view.extend({
	className: 'upfront_post-data-comments'
});

return Views;

});
})(jQuery);
