(function ($) {
	define(function() {
	var l10n = Upfront.Settings.l10n.image_element;

	var CropControls = Backbone.View.extend({
		className: 'crop-contols-wrapper',
		
		initialize: function(options) {
			this.options = options || {};
		},

		render: function() {
			
			var me = this;
			
			this.items = _([
				new Upfront.Views.Editor.Field.Button({
					model: this.model,
					label: l10n.btn.swap_image,
					id: 'image-edit-button-swap',
					className: "image-edit-button image-edit-col-full",
					compact: true,
					on_click: function() {
						me.trigger('crop:swap:image');
					}
				}),
				new Upfront.Views.Editor.Field.Button({
					model: this.model,
					label: l10n.btn.natural_size,
					id: 'image-edit-button-reset',
					className: "image-edit-button image-edit-col-full",
					compact: true,
					on_click: function() {
						me.trigger('crop:reset:image');
					}
				}),
				new Upfront.Views.Editor.Field.Button({
					model: this.model,
					label: l10n.btn.fit,
					id: 'image-edit-button-fit',
					className: "image-edit-button image-edit-col-half",
					compact: true,
					on_click: function() {
						me.trigger('crop:fit:image');
					}
				}),
				new Upfront.Views.Editor.Field.Button({
					model: this.model,
					label: l10n.btn.fill,
					id: 'image-edit-button-fill',
					className: "image-edit-button image-edit-col-half",
					compact: true,
					on_click: function() {
						me.trigger('crop:fill:image');
					}
				})
			]);
			
			this.items.each(function(item){
				item.render();
				item.delegateEvents();

				this.$el.append(item.el);
				
			}, this);
			
			return this;
		},
	});

	return CropControls;
});
})(jQuery);
