(function($) {
	
define(function(){
	return {
		bind_toggles: function () {
			this.on('show', function(){
				this.$el.show();
			});
			this.on('hide', function(){
				this.$el.hide();
			})
		},
		save_fields: function () {
			// changes are auto saved, no need to invoke this, so blank it out
		},
		preview_color: function (color) {
			if( !_.isObject( color ) ) return;
			var rgb = color.toRgb(),
				rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')';

			rgba_string = color.get_is_theme_color() !== false ?  color.theme_color : rgba_string;
			this.model.set_breakpoint_property('background_color', rgba_string);
		},
		update_color: function (color) {
			this.preview_color(color);
			this._default_color = this.model.get_breakpoint_property_value('background_color', true);
		},
		reset_color: function () {
			this.model.set_breakpoint_property('background_color', this._default_color);
		},
		upload_image: function () {
			var me = this;
			Upfront.Views.Editor.ImageSelector.open().done(function(images){
				var sizes = {},
					image_id;
				_.each(images, function(image, id){
					sizes = image;
					image_id = id;
				});
				$('<img>').attr('src', sizes.full[0]).load(function(){
					Upfront.Views.Editor.ImageSelector.close();
					me.model.set_breakpoint_property('background_image', sizes.full[0]);
					me.model.set_breakpoint_property('background_image_ratio', Math.round(sizes.full[2]/sizes.full[1]*100)/100);
				});
			});
		}
	};
});

})(jQuery);
